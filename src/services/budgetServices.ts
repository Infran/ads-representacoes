import {
  collection,
  doc,
  getDocs,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { IBudget } from "../interfaces/ibudget";

export const getNextBudgetId = async () => {
  const docRef = doc(db, "meta", "lastBudgetId");

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);

    let nextId = 1; // Começa com 1 se não existir

    if (docSnap.exists()) {
      nextId = docSnap.data().id + 1;
    }

    transaction.set(docRef, { id: nextId });

    return nextId;
  });
};

export const getBudgets = async () => {
  const budgetsCollection = collection(db, "budgets");
  const budgetsSnapshot = await getDocs(budgetsCollection);
  return budgetsSnapshot.docs.map((doc) => doc.data() as IBudget);
};

const removeUndefinedFields = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
};

export const addBudget = async (budget) => {
  const id = await getNextBudgetId();
  const createdAt = Timestamp.now();
  const updatedAt = Timestamp.now();

  // Cria o novo orçamento e remove campos undefined
  const newBudget = removeUndefinedFields({
    ...budget,
    id,
    createdAt,
    updatedAt,
  });

  const docRef = doc(db, "budgets", id.toString());
  await setDoc(docRef, newBudget);
};

export const getBudgetById = async (budgetId: string): Promise<IBudget> => {
  // Validação do ID
  if (!budgetId || typeof budgetId !== "string") {
    console.error("ID inválido:", budgetId);
    return null;
  }

  try {
    const docRef = doc(db, "budgets", budgetId);
    const docSnap = await getDoc(docRef);

    // Verifica se o documento existe
    if (!docSnap.exists()) return null;

    const data = docSnap.data();

    // Validação básica dos dados
    if (
      !data.client ||
      !data.client.name ||
      !data.selectedProducts ||
      !Array.isArray(data.selectedProducts) ||
      typeof data.totalValue !== "number" ||
      typeof data.estimatedDate !== "string" ||
      typeof data.guarantee !== "string"
    ) {
      console.error("Dados do orçamento inválidos:", data);
      return null;
    }

    // Retorna os dados com o ID do documento
    return { id: docSnap.id, ...data } as IBudget;
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error);
    return null;
  }
};

export const updateBudget = async (budgetId, budget) => {
  try {
    const docRef = doc(db, "budgets", budgetId);
    const updatedAt = Timestamp.now();
    await updateDoc(docRef, { ...budget, updatedAt });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    return false;
  }
};

export const deleteBudget = async (id: string) => {
  try {
    const docRef = doc(db, "budgets", id.toString());
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Erro ao deletar orçamento:", error);
    return false;
  }
};
