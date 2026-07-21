/**
 * withAudit — decorator que instrumenta um `CrudService` com auditoria e lixeira.
 *
 * POR QUE UM DECORATOR, e não uma edição em `createCrudService.ts`:
 * aquele arquivo é o único do app com escritas ao Firestore, o que faz dele o
 * ponto de interceptação óbvio — mas seu teste (`createCrudService.test.ts:5-19`)
 * mocka `firebase/firestore` com uma whitelist de exports e afirma que
 * `tx.set` é chamado EXATAMENTE duas vezes dentro de `add`. Qualquer import novo
 * (`writeBatch`, `setDoc`) ou escrita extra ali quebra o teste. Envolvendo por
 * fora, o arquivo e o teste originais seguem intactos.
 *
 * Efeito colateral bem-vindo: a assimetria de assinatura dos serviços
 * (`updateBudget(id, parcial)` vs `updateClient(objetoInteiro)`) já convergiu
 * para `update(id, Partial<T>)` antes de chegar aqui. Os 12 call sites da UI não
 * mudam em nada.
 */
import { CrudService } from "./createCrudService";
import { logger } from "../utils/logger";
import { BinEntity } from "../interfaces/ibin";
import { AuditLogInput } from "../interfaces/iaudit";
import {
  logAudit,
  diffFields,
  pickFields,
  capDiffPayload,
  getAuditActor,
} from "./auditService";
import { moveToBin } from "./binService";

export interface AuditableConfig<T> {
  /** Também é o nome da coleção — ver `BinEntity`. */
  entity: BinEntity;
  /** Resumo pt-BR do registro, para o painel listar sem abrir o payload. */
  label: (item: Partial<T> | null | undefined) => string;
}

/**
 * Registra sem NUNCA lançar.
 *
 * `logAudit` já se protege por dentro, mas o decorator não pode depender disso:
 * ele está no caminho de negócio, e telemetria que derruba a operação que
 * deveria observar é pior que telemetria nenhuma. Cinto e suspensório.
 */
const safeLog = (entry: AuditLogInput): void => {
  try {
    logAudit(entry);
  } catch (error) {
    logger.error("[audit] entrada descartada:", error);
  }
};

/** Extrai código e mensagem de um erro do Firebase ou de um `Error` nativo. */
const describeError = (error: unknown): Partial<AuditLogInput> => {
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  return {
    errorCode: e?.code ?? e?.cause?.code,
    errorMessage: e?.message ?? String(error),
  };
};

/**
 * A lixeira foi NEGADA pelas regras (e não falhou por rede/quota).
 *
 * Distinguir isso importa: só este caso ganha o fallback de exclusão direta.
 * Uma falha de rede derrubaria o `deleteDoc` do mesmo jeito, então cair para
 * ele não ajudaria — e apagar sem rede de segurança por causa de um erro
 * transitório seria justamente o que a lixeira existe para evitar.
 */
const isPermissionDenied = (error: unknown): boolean => {
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  const code = e?.code ?? e?.cause?.code ?? "";
  return (
    code === "permission-denied" ||
    code === "PERMISSION_DENIED" ||
    /permission[-_ ]denied/i.test(e?.message ?? "")
  );
};

export function withAudit<T extends { id: string | number }>(
  crud: CrudService<T>,
  config: AuditableConfig<T>
): CrudService<T> {
  const { entity, label } = config;

  /** Leitura do estado anterior que NÃO pode derrubar a operação de negócio. */
  const softGetById = async (id: string): Promise<T | null> => {
    try {
      return await crud.getById(id);
    } catch {
      return null;
    }
  };

  const add: CrudService<T>["add"] = async (data) => {
    let created: T;
    try {
      created = await crud.add(data);
    } catch (error) {
      // A entrada de falha carrega o payload que NÃO chegou a gravar — é o
      // artefato mais útil para investigar "cadastrei e sumiu".
      safeLog({
        action: "create",
        entity,
        entityId: "",
        label: label(data as Partial<T>),
        status: "failure",
        ...capDiffPayload({}, data as Record<string, unknown>),
        ...describeError(error),
      });
      throw error;
    }

    // Fora do try DE PROPÓSITO: se o registro do log falhasse aqui dentro, uma
    // criação bem-sucedida seria reportada como falha e o erro chegaria à UI.
    safeLog({
      action: "create",
      entity,
      entityId: String(created.id),
      label: label(created),
      status: "success",
    });
    return created;
  };

  const update: CrudService<T>["update"] = async (id, data) => {
    const before = await softGetById(id);

    try {
      await crud.update(id, data);
    } catch (error) {
      safeLog({
        action: "update",
        entity,
        entityId: String(id),
        label: label(before ?? (data as Partial<T>)),
        status: "failure",
        ...capDiffPayload({}, data as Record<string, unknown>),
        ...describeError(error),
      });
      throw error;
    }

    const after = data as Record<string, unknown>;
    const changedFields = diffFields(
      before as Record<string, unknown> | null,
      after
    );

    safeLog({
      action: "update",
      entity,
      entityId: String(id),
      label: label(before ?? (data as Partial<T>)),
      status: "success",
      changedFields,
      // Só os campos que mudaram: é o que a UI de diff precisa e mantém a
      // entrada pequena mesmo num orçamento com dezenas de produtos.
      ...capDiffPayload(
        pickFields(before as Record<string, unknown> | null, changedFields),
        pickFields(after, changedFields)
      ),
    });
  };

  const remove: CrudService<T>["remove"] = async (id) => {
    // Aqui a leitura é ESTRITA de propósito: sem o documento em mãos não há
    // como colocá-lo na lixeira, e excluir sem rede de segurança seria pior
    // que falhar. Um erro de leitura aborta a exclusão.
    const before = await crud.getById(id);

    if (!before) {
      // Documento já não existe. Preserva a idempotência do comportamento
      // anterior sem inventar uma entrada de lixeira vazia.
      await crud.remove(id);
      safeLog({
        action: "delete",
        entity,
        entityId: String(id),
        label: "Registro inexistente",
        status: "success",
      });
      return;
    }

    let binItemId: string;
    try {
      binItemId = await moveToBin(
        entity,
        String(id),
        before as unknown as Record<string, unknown>,
        label(before),
        getAuditActor()
      );
    } catch (error) {
      // A lixeira negada pelas regras NÃO pode travar a operação do usuário.
      //
      // O caso concreto: o bundle novo já está no Hosting, mas as regras que
      // liberam `bin/**` ainda não foram publicadas. Sem este fallback, a batch
      // inteira é negada e o app perde a capacidade de excluir QUALQUER coisa,
      // nas 4 entidades, até alguém rodar o deploy de regras. Preferir
      // "excluiu, mas sem rede de segurança — e está registrado" a "não
      // consegue trabalhar".
      if (isPermissionDenied(error)) {
        await crud.remove(id);
        safeLog({
          action: "delete",
          entity,
          entityId: String(id),
          label: label(before),
          // `failure` de propósito, mesmo com a exclusão tendo acontecido: o
          // que falhou foi a garantia de recuperação, e é isso que precisa
          // saltar aos olhos no painel.
          status: "failure",
          binUnavailable: true,
          ...describeError(error),
        });
        return;
      }

      safeLog({
        action: "delete",
        entity,
        entityId: String(id),
        label: label(before),
        status: "failure",
        ...describeError(error),
      });
      throw error;
    }

    safeLog({
      action: "delete",
      entity,
      entityId: String(id),
      label: label(before),
      status: "success",
      binItemId,
    });
  };

  return {
    // Leituras passam direto — nada a auditar e nada a pagar.
    getAll: crud.getAll,
    getById: crud.getById,
    getNextId: crud.getNextId,
    getPage: crud.getPage,
    add,
    update,
    remove,
  };
}
