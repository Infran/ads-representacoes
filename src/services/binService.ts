/**
 * binService — a lixeira.
 *
 * Excluir deixou de ser `deleteDoc`: o documento é MOVIDO para
 * `bin/{entity}/items/{autoId}` e sai da coleção de origem, na mesma escrita
 * atômica. O que estava lá continua sendo um documento Firestore normal, com a
 * mesma forma e os `Timestamp` intactos — nada é serializado para JSON, nada
 * precisa ser reidratado, e não há risco de estourar o limite de 1 MiB por doc
 * nem o de 1500 bytes por valor de string indexado (que faria a escrita FALHAR).
 *
 * O ID da entrada na lixeira é um auto-ID, e não o ID original: assim
 * excluir → restaurar → excluir de novo gera entradas distintas e a regra
 * append-only (`allow update: if false`) se sustenta.
 *
 * O contador `meta/{metaIdDoc}` NÃO é tocado aqui — nem na exclusão, nem na
 * restauração. Ele só é incrementado por `createCrudService.add`. É isso que
 * garante que restaurar no ID original nunca colida com uma criação futura:
 * o contador já passou daquele número.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  writeBatch,
  deleteDoc,
  query,
  orderBy,
  where,
  limit as fsLimit,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  BinEntity,
  IBinItem,
  BIN_ENTITIES,
  BIN_RETENTION_DAYS,
} from "../interfaces/ibin";

/** `bin/{entity}/items` — uma coleção com o nome da original dentro da lixeira. */
const itemsRef = (entity: BinEntity) => collection(db, "bin", entity, "items");

export interface BinActor {
  uid: string;
  email: string;
}

/**
 * Move um documento para a lixeira: grava o envelope e apaga o original numa
 * única `writeBatch`. Ou os dois acontecem, ou nenhum — nunca um documento
 * some sem ir parar na lixeira.
 *
 * @returns o ID da entrada criada na lixeira.
 */
export const moveToBin = async (
  entity: BinEntity,
  originalId: string,
  data: Record<string, unknown>,
  label: string,
  actor: BinActor
): Promise<string> => {
  if (!originalId) {
    throw new Error(`ID é obrigatório para mover ${entity} para a lixeira`);
  }

  // `doc()` sem ID gera a referência (e o auto-ID) no cliente, o que permite
  // usá-la dentro do batch e devolver o ID sem uma ida extra ao servidor.
  const binRef = doc(itemsRef(entity));

  const deletedAt = Timestamp.now();

  const envelope: Omit<IBinItem, "id"> = {
    entity,
    originalId,
    label,
    deletedAt,
    // Gravado desde o dia 1 para que ligar uma TTL policy no Console mais
    // tarde não exija backfill. Enquanto a policy não existe, o expurgo é
    // manual pelo painel (`purgeExpiredBinItems`).
    expiresAt: Timestamp.fromMillis(
      deletedAt.toMillis() + BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000
    ),
    deletedByUid: actor.uid || auth.currentUser?.uid || "desconhecido",
    deletedByEmail: actor.email || auth.currentUser?.email || "",
    data,
  };

  const batch = writeBatch(db);
  batch.set(binRef, envelope);
  batch.delete(doc(db, entity, originalId));
  await batch.commit();

  return binRef.id;
};

/** Lista a lixeira de uma entidade, mais recentes primeiro. */
export const listBin = async (entity: BinEntity): Promise<IBinItem[]> => {
  const snapshot = await getDocs(
    query(itemsRef(entity), orderBy("deletedAt", "desc"))
  );
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as IBinItem[];
};

/** Busca uma entrada específica da lixeira. */
export const getBinItem = async (
  entity: BinEntity,
  binId: string
): Promise<IBinItem | null> => {
  const snap = await getDoc(doc(itemsRef(entity), binId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as IBinItem;
};

/** Descarte definitivo: remove da lixeira SEM restaurar. Só admin (ver regras). */
export const purgeBinItem = async (
  entity: BinEntity,
  binId: string
): Promise<void> => {
  await deleteDoc(doc(itemsRef(entity), binId));
};

/**
 * Quantos itens há na lixeira, somando as 4 subcoleções.
 *
 * Usa `getCountFromServer` em vez de baixar os documentos: um envelope carrega
 * o registro inteiro (um orçamento embute cliente, representante e produtos),
 * então contar por download seria caro à toa numa tela de visão geral.
 */
export const countBinItems = async (): Promise<number> => {
  const counts = await Promise.all(
    BIN_ENTITIES.map(async (entity) => {
      const snap = await getCountFromServer(itemsRef(entity));
      return snap.data().count;
    })
  );
  return counts.reduce((total, n) => total + n, 0);
};

/**
 * Expurga os itens já vencidos (`expiresAt <= agora`), em todas as entidades.
 *
 * Manual por ora. Itens gravados antes de `expiresAt` existir não têm o campo e
 * simplesmente não aparecem na query — o que é o comportamento seguro: eles
 * ficam até serem descartados à mão, em vez de sumirem por engano.
 *
 * @returns quantos itens foram removidos.
 */
export const purgeExpiredBinItems = async (): Promise<number> => {
  const now = Timestamp.now();

  const removed = await Promise.all(
    BIN_ENTITIES.map(async (entity) => {
      const snapshot = await getDocs(
        query(itemsRef(entity), where("expiresAt", "<=", now), fsLimit(200))
      );
      await Promise.all(
        snapshot.docs.map((d) => deleteDoc(doc(itemsRef(entity), d.id)))
      );
      return snapshot.size;
    })
  );

  return removed.reduce((total, n) => total + n, 0);
};
