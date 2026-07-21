/**
 * restoreService — devolve um documento da lixeira para a coleção de origem.
 *
 * Duas garantias que o usuário pediu explicitamente:
 *
 * 1. **O ID visual é preservado.** A restauração é um `setDoc` no ID original,
 *    nunca um `add` — que geraria um número novo e queimaria o contador.
 *
 * 2. **O contador não se perde.** `meta/{metaIdDoc}` só é incrementado por
 *    `createCrudService.add`; nem excluir nem restaurar encostam nele. Como o
 *    contador nunca regride, quando o registro 42 é excluído ele já está em 42+
 *    e o próximo cadastro será 43 — então recolocar o 42 no lugar jamais colide
 *    com uma criação futura. A checagem de ocupação abaixo é cinto e
 *    suspensório para o caso de um documento ter sido criado fora do app.
 */
import { doc, getDoc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { BinEntity, IBinItem, BIN_ENTITY_LABELS } from "../interfaces/ibin";
import { logAudit } from "./auditService";
import { logger } from "../utils/logger";

export type RestoreFailure = "occupied" | "invalid" | "not-found";

export interface RestoreResult {
  ok: boolean;
  reason?: RestoreFailure;
  message?: string;
}

/**
 * Validação mínima por entidade, espelhando o que as firestore.rules exigem.
 *
 * Rodar isto ANTES do `setDoc` transforma um `permission-denied` confuso (as
 * regras de `budgets` exigem `totalValue` numérico e `selectedProducts` lista)
 * numa mensagem que diz o que realmente aconteceu.
 */
const isRestorable = (entity: BinEntity, data: Record<string, unknown>): boolean => {
  if (!data || typeof data !== "object") return false;
  if (entity !== "budgets") return true;
  return (
    typeof data.totalValue === "number" &&
    data.totalValue >= 0 &&
    Array.isArray(data.selectedProducts)
  );
};

export const restoreFromBin = async (
  item: IBinItem
): Promise<RestoreResult> => {
  const { entity, originalId, data } = item;
  const label = BIN_ENTITY_LABELS[entity] ?? entity;

  if (!originalId || !data) {
    return {
      ok: false,
      reason: "not-found",
      message: "Esta entrada da lixeira está incompleta e não pode ser restaurada.",
    };
  }

  if (!isRestorable(entity, data)) {
    return {
      ok: false,
      reason: "invalid",
      message: `Este ${label.toLowerCase()} está com dados inconsistentes e seria rejeitado ao gravar.`,
    };
  }

  const targetRef = doc(db, entity, originalId);

  const existing = await getDoc(targetRef);
  if (existing.exists()) {
    return {
      ok: false,
      reason: "occupied",
      message: `Já existe um registro com o ID ${originalId}. A restauração foi cancelada para não sobrescrevê-lo.`,
    };
  }

  // Recolocar o documento e limpar a lixeira na MESMA batch: sem isso, uma
  // falha no meio deixaria o registro duplicado (vivo e na lixeira) ou
  // desaparecido dos dois lados.
  const batch = writeBatch(db);
  batch.set(targetRef, {
    ...data,
    // `createdAt` original é preservado; só a marca de atualização avança.
    updatedAt: Timestamp.now(),
  });
  batch.delete(doc(db, "bin", entity, "items", item.id));
  await batch.commit();

  logAudit({
    action: "restore",
    entity,
    entityId: originalId,
    label: item.label,
    status: "success",
    restoredFrom: item.id,
  });

  logger.info(`[restore] ${entity}/${originalId} restaurado da lixeira`);
  return { ok: true };
};
