/**
 * auditService — registro append-only de tudo que acontece no app.
 *
 * Existe porque, em produção, o app é cego: `logger` roda em nível `silent` e o
 * `esbuild.drop` remove `console` do bundle. Uma escrita que falha não deixa
 * rastro nenhum, e é exatamente esse o caso que o usuário reporta ("cadastrei e
 * sumiu"). O Firestore passa a ser o destino da telemetria, não o console.
 *
 * Duas regras que este módulo NÃO pode violar:
 * 1. Uma falha ao gravar auditoria nunca pode derrubar a operação de negócio.
 * 2. Uma falha ao gravar auditoria também não pode ser engolida em silêncio —
 *    daí `getAuditHealth()`, exposto como faixa de alerta no painel.
 */
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit as fsLimit,
  startAfter,
  where,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { logger } from "../utils/logger";
import { IAuditLog, AuditLogInput, AuditAction } from "../interfaces/iaudit";
import { StaffRole } from "./staffService";

const COLLECTION = "auditLogs";

/** Retenção padrão. Gravada como `expiresAt` para habilitar TTL policy depois. */
const RETENTION_DAYS = 180;

/**
 * Teto do payload de diff de uma edição. Acima disso o payload é DESCARTADO
 * (nunca truncado no meio: um JSON cortado é ilegível) e a entrada fica só com
 * `changedFields` + `truncated: true`.
 */
const MAX_PAYLOAD_BYTES = 60_000;

// ============================================================================
// ATOR — registry no padrão de `registerFeedbackMethods` (src/ui/Feedback.ts)
// ============================================================================

export interface AuditActor {
  uid: string;
  email: string;
  role: StaffRole;
}

let currentActor: AuditActor | null = null;

/**
 * Injeta a identidade de quem está agindo. Chamado pelo `AuthProvider` assim que
 * o papel resolve, e anulado no logout.
 *
 * É um registry em vez de leitura direta de `auth.currentUser` porque assim o
 * módulo continua testável sem mock de Firebase — e porque carrega o `role`, que
 * `auth.currentUser` não tem.
 */
export const registerAuditActor = (actor: AuditActor | null): void => {
  currentActor = actor;
};

/**
 * Ator atual, com fallback para `auth.currentUser` caso o registry ainda não
 * tenha sido preenchido — um log com o uid certo vale mais que nenhum log.
 */
export const getAuditActor = (): { uid: string; email: string } => {
  if (currentActor) {
    return { uid: currentActor.uid, email: currentActor.email };
  }
  const user = auth.currentUser;
  return { uid: user?.uid ?? "desconhecido", email: user?.email ?? "" };
};

// ============================================================================
// SAÚDE — falhas de gravação não podem sumir
// ============================================================================

/**
 * A saúde vive em `sessionStorage`, e não em memória de módulo.
 *
 * O motivo é o cenário real: quem sofre a falha é o STAFF, no meio de um
 * cadastro; quem abre o painel é o ADMIN, depois, em outra aba ou outra
 * máquina. Um contador em memória de módulo morre no primeiro reload e leria
 * zero justamente para quem precisa vê-lo — a garantia de "não engolir em
 * silêncio" ficaria valendo só no papel.
 *
 * Mesmo mecanismo que o `errorReporter` já usa para o estado de dedup.
 */
const HEALTH_KEY = "ads_audit_health";

export interface AuditHealth {
  failures: number;
  lastFailureMessage: string | null;
  /** Quando a última falha aconteceu (epoch ms), para datar o alerta. */
  lastFailureAt: number | null;
}

const emptyHealth = (): AuditHealth => ({
  failures: 0,
  lastFailureMessage: null,
  lastFailureAt: null,
});

export const getAuditHealth = (): AuditHealth => {
  try {
    const raw = sessionStorage.getItem(HEALTH_KEY);
    if (!raw) return emptyHealth();
    return { ...emptyHealth(), ...(JSON.parse(raw) as AuditHealth) };
  } catch {
    return emptyHealth();
  }
};

/** Zera o contador — o admin marca como "já vi" depois de investigar. */
export const clearAuditHealth = (): void => {
  try {
    sessionStorage.removeItem(HEALTH_KEY);
  } catch {
    // Storage indisponível: nada a fazer, e não vale derrubar nada por isso.
  }
};

const recordAuditFailure = (error: unknown): void => {
  try {
    const health = getAuditHealth();
    sessionStorage.setItem(
      HEALTH_KEY,
      JSON.stringify({
        failures: health.failures + 1,
        lastFailureMessage:
          error instanceof Error
            ? error.message
            : String(error ?? "erro desconhecido"),
        lastFailureAt: Date.now(),
      } satisfies AuditHealth)
    );
  } catch {
    // Cota estourada ou storage indisponível. Perder a contabilidade da falha
    // é ruim, mas lançar aqui derrubaria o `.catch` de uma escrita de auditoria
    // — que é justamente o caminho que nunca pode explodir.
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/** Firestore rejeita `undefined`; a entrada tem muitos campos opcionais. */
const removeUndefined = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as T;

const byteLength = (value: unknown): number => {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    // Referência circular ou valor não serializável: trata como grande demais.
    return Number.MAX_SAFE_INTEGER;
  }
};

/**
 * Campos de `after` cujo valor difere de `before`.
 *
 * Compara por JSON porque os valores incluem `Timestamp` e objetos aninhados
 * (um orçamento embute cliente, representante e produtos). Campos que não
 * mudaram — inclusive o `id` e o `updatedAt` antigo que os serviços de objeto
 * inteiro reenviam — são naturalmente filtrados.
 */
export const diffFields = (
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>
): string[] =>
  Object.keys(after).filter(
    (key) => JSON.stringify(before?.[key]) !== JSON.stringify(after[key])
  );

/** Recorta um objeto às chaves informadas. */
export const pickFields = (
  source: Record<string, unknown> | null | undefined,
  keys: string[]
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (!source) return out;
  for (const key of keys) {
    if (key in source) out[key] = source[key];
  }
  return out;
};

/**
 * Aplica o teto de tamanho ao par before/after de uma edição.
 * Retorna o payload ou, se estourar, `truncated: true` sem payload.
 */
export const capDiffPayload = (
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Pick<AuditLogInput, "before" | "after" | "truncated"> => {
  if (byteLength(before) + byteLength(after) > MAX_PAYLOAD_BYTES) {
    return { truncated: true };
  }
  return { before, after };
};

// ============================================================================
// ESCRITA
// ============================================================================

/**
 * Grava uma entrada e devolve seu ID. Pode rejeitar — use `logAudit` no caminho
 * de negócio; esta versão é para quem realmente precisa do resultado.
 */
export const writeAuditLog = async (input: AuditLogInput): Promise<string> => {
  const actor = getAuditActor();

  // `at` é SERVER-SIDE de propósito, divergindo do `Timestamp.now()` que o
  // resto do app usa. O motivo daquele padrão (documentado em
  // `createCrudService`) é que o cache otimista grava o objeto retornado em
  // localStorage, e um sentinel de `serverTimestamp()` não serializa — mas
  // `auditLogs` nunca passa pelo cache: é sempre lido fresco do Firestore.
  //
  // Aqui o relógio autoritativo é o que importa: as regras exigem
  // `at == request.time`, o que impede um staff de forjar o horário de uma
  // entrada. Um log com carimbo de hora do cliente não audita coisa alguma.
  const expiresAt = Timestamp.fromMillis(
    Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const entry = removeUndefined({
    ...input,
    at: serverTimestamp(),
    expiresAt,
    actorUid: actor.uid,
    actorEmail: actor.email,
  });

  const ref = await addDoc(collection(db, COLLECTION), entry);
  return ref.id;
};

/**
 * Versão fire-and-forget: NUNCA rejeita e nunca é aguardada pelo caminho de
 * negócio. A falha é contabilizada em `getAuditHealth()` e sai pelo `logger`
 * (que é silencioso em prod — por isso o contador existe).
 *
 * Cuidado deliberado: o catch chama apenas `logger.error`. Chamar `captureError`
 * ou `notifyError` aqui criaria recursão — um erro ao gravar o log geraria outro
 * log, que falharia igual.
 */
export const logAudit = (input: AuditLogInput): void => {
  // O try/catch cobre a montagem SÍNCRONA da entrada (resolver o ator, montar
  // os Timestamps). Sem ele, um erro aqui escaparia para o chamador — e o
  // chamador é o caminho de negócio, que passaria a reportar como falha uma
  // operação que deu certo.
  try {
    void writeAuditLog(input).catch((error) => {
      recordAuditFailure(error);
      logger.error("[audit] falha ao gravar entrada de auditoria:", error);
    });
  } catch (error) {
    recordAuditFailure(error);
    logger.error("[audit] falha ao montar entrada de auditoria:", error);
  }
};

// ============================================================================
// LEITURA (somente admin — as regras negam para staff comum)
// ============================================================================

export interface AuditPage {
  logs: IAuditLog[];
  lastDoc?: QueryDocumentSnapshot;
  hasMore: boolean;
}

/**
 * Página por cursor, ordenada por `at` desc.
 *
 * Sem `action`, usa só o índice single-field automático, e o facetamento
 * (entidade, ator, busca livre) acontece no cliente sobre as páginas já
 * carregadas — barato o bastante no volume deste app.
 *
 * COM `action`, usa o índice composto `{action ASC, at DESC}` declarado em
 * `firestore.indexes.json`. Ele existe por um motivo específico: `auditLogs` é
 * dominado por entradas de CRUD, e filtrar `action == "error"` no cliente
 * significaria que uma tarde de cadastros normal empurra o erro raro — o motivo
 * de toda esta feature existir — para fora da janela carregada. A tela de Erros
 * mostraria "nenhum erro" com o erro a três páginas de distância.
 */
export const fetchAuditLogs = async (
  pageSize = 50,
  cursor?: QueryDocumentSnapshot,
  action?: AuditAction
): Promise<AuditPage> => {
  const base = collection(db, COLLECTION);
  const constraints = [
    ...(action ? [where("action", "==", action)] : []),
    orderBy("at", "desc"),
    ...(cursor ? [startAfter(cursor)] : []),
    fsLimit(pageSize),
  ];

  const snapshot = await getDocs(query(base, ...constraints));
  const docs = snapshot.docs;

  return {
    logs: docs.map((d) => ({ id: d.id, ...d.data() })) as IAuditLog[],
    lastDoc: docs[docs.length - 1],
    hasMore: docs.length === pageSize,
  };
};

/**
 * Expurga entradas cujo `expiresAt` já passou. Manual por ora — quando uma TTL
 * policy for ligada no Console, o campo já está lá e isto vira redundante.
 */
export const purgeExpiredAuditLogs = async (): Promise<number> => {
  const q = query(
    collection(db, COLLECTION),
    where("expiresAt", "<=", Timestamp.now()),
    fsLimit(400)
  );
  const snapshot = await getDocs(q);
  await Promise.all(
    snapshot.docs.map((d) => deleteDoc(doc(db, COLLECTION, d.id)))
  );
  return snapshot.size;
};

// ============================================================================
// EXCLUSÃO PONTUAL / POR INTERVALO (somente admin — regras negam para staff)
// ============================================================================

/**
 * Remove UMA entrada pelo id. As regras exigem `isAdmin()` — a UI que chama
 * isto (painel de Erros) já é admin-only.
 */
export const deleteAuditLog = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

/**
 * Remove várias entradas pelos ids, em paralelo. Usado para apagar de uma vez
 * todas as ocorrências agrupadas de um mesmo erro (mesma assinatura). Retorna
 * quantas foram removidas.
 */
export const deleteAuditLogs = async (ids: string[]): Promise<number> => {
  await Promise.all(ids.map((id) => deleteDoc(doc(db, COLLECTION, id))));
  return ids.length;
};

/**
 * Expurga entradas cujo `at` cai no intervalo [from, to] (inclusive),
 * opcionalmente restrito a uma `action` (ex.: só "error").
 *
 * Itera em páginas de `pageSize`: como deleta exatamente o que lê, cada volta
 * re-consulta do topo em vez de paginar por cursor — o cursor apontaria para
 * um documento que acabou de sumir. Para quando uma página vier incompleta.
 *
 * COM `action`, usa o índice composto `{action ASC, at DESC}` já declarado em
 * `firestore.indexes.json` (igualdade em `action` + faixa/ordenação em `at`).
 */
export const purgeAuditLogsInRange = async (
  from: Date,
  to: Date,
  action?: AuditAction,
  pageSize = 400
): Promise<number> => {
  const fromTs = Timestamp.fromDate(from);
  const toTs = Timestamp.fromDate(to);
  let removed = 0;

  for (;;) {
    const constraints = [
      ...(action ? [where("action", "==", action)] : []),
      where("at", ">=", fromTs),
      where("at", "<=", toTs),
      orderBy("at", "desc"),
      fsLimit(pageSize),
    ];
    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    if (snapshot.empty) break;

    await Promise.all(
      snapshot.docs.map((d) => deleteDoc(doc(db, COLLECTION, d.id)))
    );
    removed += snapshot.size;

    if (snapshot.size < pageSize) break;
  }

  return removed;
};
