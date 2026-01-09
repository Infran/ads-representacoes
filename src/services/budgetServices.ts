import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { IBudget } from "../interfaces/ibudget";

// ============================================================================
// FUNÇÕES DE LEITURA
// ============================================================================

/**
 * Busca todos os orçamentos do Firestore.
 * NOTA: Prefira usar useData().budgets do DataContext para evitar chamadas desnecessárias.
 * Esta função é usada internamente pelo DataContext para popular o cache.
 */
export const getBudgets = async (): Promise<IBudget[]> => {
  const budgetsCollection = collection(db, "budgets");
  const budgetsSnapshot = await getDocs(budgetsCollection);

  return budgetsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IBudget[];
};

/**
 * Busca um orçamento pelo ID.
 * @param budgetId - ID do orçamento
 * @returns Orçamento encontrado ou null se não existir ou for inválido
 */
export const getBudgetById = async (
  budgetId: string
): Promise<IBudget | null> => {
  if (!budgetId || typeof budgetId !== "string") {
    console.warn("getBudgetById chamado com ID inválido:", budgetId);
    return null;
  }

  try {
    const docRef = doc(db, "budgets", budgetId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    // Validação básica dos dados obrigatórios
    if (
      !data.client ||
      !data.selectedProducts ||
      !Array.isArray(data.selectedProducts)
    ) {
      console.warn("Dados do orçamento incompletos:", budgetId);
      // Retorna mesmo assim, mas com log de aviso
    }

    return { id: docSnap.id, ...data } as IBudget;
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error);
    throw error;
  }
};

// ============================================================================
// FUNÇÕES DE ESCRITA
// ============================================================================

/**
 * Gera o próximo ID de orçamento de forma atômica usando transação.
 * Isso garante que dois requests simultâneos não gerem o mesmo ID.
 * @returns Próximo ID disponível
 */
export const getNextBudgetId = async (): Promise<number> => {
  const docRef = doc(db, "meta", "lastBudgetId");

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    const data = docSnap.data();
    const nextId = docSnap.exists() && data ? data.id + 1 : 1;
    transaction.set(docRef, { id: nextId });
    return nextId;
  });
};

/**
 * Remove campos undefined de um objeto (Firestore não aceita undefined).
 */
const removeUndefinedFields = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
};

/**
 * Valida os dados do orçamento antes de salvar.
 * @param budget - Orçamento a ser validado
 * @throws Error se os dados forem inválidos
 */
const validateBudget = (budget: Partial<IBudget>): void => {
  if (!budget.representative || !budget.representative.name) {
    throw new Error("Representante é obrigatório");
  }
  if (!budget.selectedProducts || budget.selectedProducts.length === 0) {
    throw new Error("Pelo menos um produto deve ser selecionado");
  }
  if (!budget.estimatedDate) {
    throw new Error("Prazo de entrega é obrigatório");
  }
};

/**
 * Adiciona um novo orçamento ao Firestore.
 * @param budget - Dados do orçamento (sem ID, será gerado automaticamente)
 * @returns Orçamento criado com ID e timestamps
 * @throws Error se a validação falhar ou ocorrer erro no Firestore
 */
export const addBudget = async (
  budget: Omit<IBudget, "id" | "createdAt" | "updatedAt">
): Promise<IBudget> => {
  // Valida os dados
  validateBudget(budget);

  // Gera ID único de forma atômica
  const id = await getNextBudgetId();
  const createdAt = Timestamp.now();
  const updatedAt = Timestamp.now();

  // Cria o novo orçamento e remove campos undefined
  const newBudget = removeUndefinedFields({
    ...budget,
    id: id.toString(), // Converte para string para compatibilidade com a interface
    createdAt,
    updatedAt,
  }) as IBudget;

  const docRef = doc(db, "budgets", id.toString());
  await setDoc(docRef, newBudget);

  return newBudget;
};

/**
 * Atualiza um orçamento existente.
 * @param budgetId - ID do orçamento a atualizar
 * @param budget - Dados atualizados do orçamento
 * @throws Error se ocorrer erro no Firestore
 */
export const updateBudget = async (
  budgetId: string,
  budget: Partial<IBudget>
): Promise<void> => {
  if (!budgetId) {
    throw new Error("ID do orçamento é obrigatório para atualização");
  }

  const docRef = doc(db, "budgets", budgetId);
  const updatedAt = Timestamp.now();

  // Remove campos undefined antes de enviar
  const cleanedBudget = removeUndefinedFields({ ...budget, updatedAt });

  await updateDoc(docRef, cleanedBudget);
};

/**
 * Exclui um orçamento pelo ID.
 * @param id - ID do orçamento a ser excluído
 * @throws Error se ocorrer erro no Firestore
 */
export const deleteBudget = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("ID do orçamento é obrigatório para exclusão");
  }

  const docRef = doc(db, "budgets", id.toString());
  await deleteDoc(docRef);
};
