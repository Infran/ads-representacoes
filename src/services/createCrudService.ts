/**
 * createCrudService — factory genérica para a camada de services (EST F2.1).
 *
 * Colapsa a repetição 4× que existia em budget/client/product/representative
 * Services (getAll/getById/getNextId/add/update/delete + limpeza de `undefined`).
 * Cada service passa a ser só configuração + wrappers finos que preservam a API
 * pública que o `DataContext`/modais já consomem.
 *
 * Decisões de padronização tomadas nesta consolidação:
 * - **Timestamp:** `Timestamp.now()` para todos (antes budget usava `Timestamp.now()`
 *   e os demais `serverTimestamp()`). O padrão de cache otimista do app devolve o
 *   objeto criado para ser gravado direto no cache/localStorage — um sentinel de
 *   `serverTimestamp()` não serializa em JSON nem ordena por `createdAt`, então
 *   `Timestamp.now()` é o correto e uniforme aqui.
 * - **removeUndefinedFields:** unificado neste módulo (antes: helper nomeado em
 *   budgetServices + cópia inline nos outros três).
 * - **Criação atômica (SEG S2.1):** incremento do contador + `set` do doc na MESMA
 *   `runTransaction` — ver `add`.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  runTransaction,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { logger } from "../utils/logger";

/**
 * Remove campos `undefined` de um objeto (Firestore não aceita `undefined`).
 */
const removeUndefinedFields = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

export interface CrudServiceConfig<T> {
  /** Nome da coleção no Firestore (ex.: "budgets"). */
  collectionName: string;
  /** Doc de contador de ID em `meta/{metaIdDoc}` (ex.: "lastBudgetId"). */
  metaIdDoc: string;
  /** Validação (lança `Error`) executada antes de `add` e `update`. Opcional. */
  validate?: (data: Partial<T>) => void;
  /**
   * Whitelist opcional para `getById`. Quando presente, um ID que não casar é
   * rejeitado (retorna `null`) — usado por `budgets` (`^\d+$`) para impedir que
   * um parâmetro de URL malicioso altere a estrutura do path (SEG S1.2). Quando
   * ausente, `getById` só rejeita ID vazio.
   */
  idPattern?: RegExp;
}

export interface PageResult<T> {
  items: T[];
  /** Cursor opaco (último doc da página) para pedir a próxima via `getPage`. */
  lastDoc?: QueryDocumentSnapshot;
  /** `true` se a página veio cheia (provavelmente há mais). */
  hasMore: boolean;
}

export interface CrudService<T> {
  getAll: () => Promise<T[]>;
  getById: (id: string) => Promise<T | null>;
  getNextId: () => Promise<number>;
  add: (data: Omit<T, "id" | "createdAt" | "updatedAt">) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /**
   * Página por cursor (`orderBy createdAt desc` + `limit` + `startAfter`). Lê
   * O(pageSize) docs em vez da coleção inteira — PERF P1.2. Ver nota de deferral
   * em `budgetServices.getBudgetsPage`.
   */
  getPage: (
    pageSize: number,
    cursor?: QueryDocumentSnapshot
  ) => Promise<PageResult<T>>;
}

export function createCrudService<T extends { id: string | number }>(
  config: CrudServiceConfig<T>
): CrudService<T> {
  const { collectionName, metaIdDoc, validate, idPattern } = config;

  const getAll = async (): Promise<T[]> => {
    const snapshot = await getDocs(collection(db, collectionName));
    // O id do documento é autoritativo: vem por ÚLTIMO para não ser sombreado
    // por um campo `id` legado gravado como number dentro do próprio doc (que,
    // como number, quebraria doc()/getById mais adiante — ver getById).
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
  };

  const getById = async (id: string): Promise<T | null> => {
    // Docs legados gravaram o campo `id` como number. doc() exige string e
    // estoura ("path.indexOf is not a function") com number — por isso o id é
    // coagido aqui, igual update/remove já fazem com `id.toString()`. Sem isso,
    // abrir a modal de edição de um registro legado dá erro engolido (o logger
    // é silencioso em produção) e a modal aparece vazia.
    const key = id == null ? "" : String(id);
    if (idPattern) {
      if (!idPattern.test(key)) {
        logger.warn(`getById(${collectionName}) com ID inválido:`, id);
        return null;
      }
    } else if (!key) {
      logger.warn(`getById(${collectionName}) chamado com ID vazio`);
      return null;
    }

    try {
      const snap = await getDoc(doc(db, collectionName, key));
      if (!snap.exists()) return null;
      return { ...snap.data(), id: snap.id } as T;
    } catch (error) {
      logger.error(`Erro ao buscar ${collectionName}:`, error);
      throw error;
    }
  };

  /**
   * Gera o próximo ID de forma atômica (transação sobre `meta/{metaIdDoc}`).
   * Mantido público para preservar a API; a criação (`add`) faz o incremento
   * dentro da própria transação de escrita (ver SEG S2.1 em `add`).
   */
  const getNextId = async (): Promise<number> => {
    const metaRef = doc(db, "meta", metaIdDoc);
    return runTransaction(db, async (transaction) => {
      const snap = await transaction.get(metaRef);
      const data = snap.data();
      const nextId = snap.exists() && data ? data.id + 1 : 1;
      transaction.set(metaRef, { id: nextId });
      return nextId;
    });
  };

  /**
   * Criação ATÔMICA (SEG S2.1): o incremento do contador em `meta/{metaIdDoc}` e
   * o `set` do novo documento acontecem na MESMA `runTransaction`. Se o `set`
   * falhar, o incremento é revertido — não deixa "buraco" no contador (o bug de
   * criação não-atômica do relatório de Segurança).
   */
  const add = async (
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ): Promise<T> => {
    if (validate) validate(data as Partial<T>);

    return runTransaction(db, async (transaction) => {
      const metaRef = doc(db, "meta", metaIdDoc);
      const metaSnap = await transaction.get(metaRef);
      const metaData = metaSnap.data();
      const nextId = metaSnap.exists() && metaData ? metaData.id + 1 : 1;

      const createdAt = Timestamp.now();
      const updatedAt = Timestamp.now();

      const newDoc = removeUndefinedFields({
        ...data,
        id: nextId.toString(),
        createdAt,
        updatedAt,
      }) as unknown as T;

      transaction.set(metaRef, { id: nextId });
      transaction.set(
        doc(db, collectionName, nextId.toString()),
        newDoc as DocumentData
      );

      return newDoc;
    });
  };

  const update = async (id: string, data: Partial<T>): Promise<void> => {
    if (!id) {
      throw new Error(`ID é obrigatório para atualização em ${collectionName}`);
    }
    if (validate) validate(data);

    const updatedAt = Timestamp.now();
    const cleaned = removeUndefinedFields({ ...data, updatedAt });
    await updateDoc(
      doc(db, collectionName, id.toString()),
      cleaned as DocumentData
    );
  };

  const remove = async (id: string): Promise<void> => {
    if (!id) {
      throw new Error(`ID é obrigatório para exclusão em ${collectionName}`);
    }
    await deleteDoc(doc(db, collectionName, id.toString()));
  };

  const getPage = async (
    pageSize: number,
    cursor?: QueryDocumentSnapshot
  ): Promise<PageResult<T>> => {
    const base = collection(db, collectionName);
    const q = cursor
      ? query(base, orderBy("createdAt", "desc"), startAfter(cursor), limit(pageSize))
      : query(base, orderBy("createdAt", "desc"), limit(pageSize));

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const items = docs.map((d) => ({ ...d.data(), id: d.id })) as T[];

    return {
      items,
      lastDoc: docs[docs.length - 1],
      // Página cheia ⇒ provavelmente há mais.
      hasMore: docs.length === pageSize,
    };
  };

  return { getAll, getById, getNextId, add, update, remove, getPage };
}
