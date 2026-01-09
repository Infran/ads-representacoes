import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { IRepresentative } from "../interfaces/irepresentative";

// ============================================================================
// FUNÇÕES DE LEITURA
// ============================================================================

/**
 * Busca todos os representantes do Firestore.
 * NOTA: Prefira usar useData().representatives do DataContext para evitar chamadas desnecessárias.
 * Esta função é usada internamente pelo DataContext para popular o cache.
 */
export const getRepresentatives = async (): Promise<IRepresentative[]> => {
  const representativesCollection = collection(db, "representatives");
  const representativesSnapshot = await getDocs(representativesCollection);

  return representativesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IRepresentative[];
};

/**
 * Busca um representante pelo ID.
 * @param id - ID do representante
 * @returns Representante encontrado ou null se não existir
 */
export const getRepresentativeById = async (
  id: string
): Promise<IRepresentative | null> => {
  if (!id) {
    console.warn("getRepresentativeById chamado com ID vazio");
    return null;
  }

  try {
    const representativeDoc = doc(db, "representatives", id);
    const representativeSnap = await getDoc(representativeDoc);

    if (!representativeSnap.exists()) {
      return null;
    }

    return {
      id: representativeSnap.id,
      ...representativeSnap.data(),
    } as IRepresentative;
  } catch (error) {
    console.error("Erro ao buscar representante:", error);
    throw error;
  }
};

/**
 * @deprecated Use useData().searchRepresentativesLocal() para busca com cache local.
 * Esta função ainda faz chamadas ao Firestore - evite usá-la.
 */
export const searchRepresentatives = async (
  searchTerm: string
): Promise<IRepresentative[]> => {
  console.warn(
    "[DEPRECATED] searchRepresentatives está deprecated. Use searchRepresentativesLocal do DataContext para evitar reads no Firestore."
  );

  const representatives = await getRepresentatives();

  if (!searchTerm?.trim()) {
    return representatives;
  }

  const term = searchTerm.toLowerCase();
  return representatives.filter(
    (representative) =>
      representative.name?.toLowerCase().includes(term) ||
      representative.email?.toLowerCase().includes(term) ||
      representative.client?.name?.toLowerCase().includes(term)
  );
};

// ============================================================================
// FUNÇÕES DE ESCRITA
// ============================================================================

/**
 * Gera o próximo ID de representante de forma atômica usando transação.
 * Isso garante que dois requests simultâneos não gerem o mesmo ID.
 * @returns Próximo ID disponível
 */
export const getNextRepresentativeId = async (): Promise<number> => {
  const docRef = doc(db, "meta", "lastRepresentativeId");

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    const data = docSnap.data();
    const nextId = docSnap.exists() && data ? data.id + 1 : 1;
    transaction.set(docRef, { id: nextId });
    return nextId;
  });
};

/**
 * Valida os dados do representante antes de salvar.
 * @param representative - Representante a ser validado
 * @throws Error se os dados forem inválidos
 */
const validateRepresentative = (
  representative: Partial<IRepresentative>
): void => {
  if (!representative.name?.trim()) {
    throw new Error("Nome do representante é obrigatório");
  }
};

/**
 * Adiciona um novo representante ao Firestore.
 * @param representative - Dados do representante (sem ID, será gerado automaticamente)
 * @returns Representante criado com ID e timestamps
 * @throws Error se a validação falhar ou ocorrer erro no Firestore
 */
export const addRepresentative = async (
  representative: Omit<IRepresentative, "id" | "createdAt" | "updatedAt">
): Promise<IRepresentative> => {
  // Valida os dados
  validateRepresentative(representative);

  // Gera ID único de forma atômica
  const id = await getNextRepresentativeId();
  const createdAt = serverTimestamp();
  const updatedAt = serverTimestamp();

  const newRepresentative = {
    ...representative,
    id: id.toString(), // Converte para string para compatibilidade com a interface
    createdAt,
    updatedAt,
  } as IRepresentative;

  const docRef = doc(db, "representatives", id.toString());
  await setDoc(docRef, newRepresentative);

  return newRepresentative;
};

/**
 * Atualiza um representante existente.
 * Usa updateDoc para atualização parcial, preservando campos não enviados.
 * @param representative - Representante com dados atualizados (ID obrigatório)
 * @throws Error se o ID não for fornecido ou ocorrer erro no Firestore
 */
export const updateRepresentative = async (
  representative: IRepresentative
): Promise<void> => {
  if (!representative.id) {
    throw new Error("ID do representante é obrigatório para atualização");
  }

  // Valida os dados
  validateRepresentative(representative);

  const docRef = doc(db, "representatives", representative.id.toString());
  const updatedAt = serverTimestamp();

  // Remove campos undefined antes de enviar
  const cleanedRepresentative = Object.fromEntries(
    Object.entries(representative).filter(([_, value]) => value !== undefined)
  );

  await updateDoc(docRef, { ...cleanedRepresentative, updatedAt });
};

/**
 * Exclui um representante pelo ID.
 * @param id - ID do representante a ser excluído
 * @throws Error se ocorrer erro no Firestore
 */
export const deleteRepresentative = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("ID do representante é obrigatório para exclusão");
  }

  const docRef = doc(db, "representatives", id);
  await deleteDoc(docRef);
};
