import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { IBudget } from "../interfaces/ibudget";

export const getNextBudgetId = async () => {
  const docRef = doc(db, "meta", "lastBudgetId");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const currentId = docSnap.data().id;
    const nextId = currentId + 1;
    await setDoc(docRef, { id: nextId });
    return nextId;
  } else {
    await setDoc(docRef, { id: 1 });
    return 1;
  }
};

export const fetchBudgets = async () => {
  const budgetsCollection = collection(db, "budgets");
  const budgetsSnapshot = await getDocs(budgetsCollection);
  return budgetsSnapshot.docs.map((doc) => doc.data() as IBudget);
};

export const addBudget = async (budget) => {
  const id = await getNextBudgetId();
  const newBudget = { ...budget, id };
  const budgetsCollection = collection(db, "budgets");
  const docRef = await addDoc(budgetsCollection, newBudget);
  return docRef.id;
};

export const getBudgetById = async (budgetId) => {
  const docRef = doc(db, "budgets", budgetId);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

export const updateBudget = async (budgetId, budget) => {
  const docRef = doc(db, "budgets", budgetId);
  await setDoc(docRef, budget);
};

export const deleteBudget = async (budgetId) => {
  const docRef = doc(db, "budgets", budgetId);
  await deleteDoc(docRef);
};