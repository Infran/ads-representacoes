import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { IProduct } from "../interfaces/iproduct";

export const getNextProductId = async () => {
  const docRef = doc(db, "meta", "lastProductId");
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

export const searchProducts = async (searchTerm) => {
  const productsCollection = collection(db, "products");
  const productsSnapshot = await getDocs(productsCollection);
  const products = productsSnapshot.docs.map((doc) => doc.data());
  return products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.ncm.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const getProducts = async (): Promise<IProduct[]> => {
  const productsCollection = collection(db, "products");
  const productsSnapshot = await getDocs(productsCollection);
  return productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IProduct[];
};

export const addProduct = async (product) => {
  try {
    const id = await getNextProductId();
    const createdAt = serverTimestamp();
    const updatedAt = serverTimestamp();
    
    const newProduct = { ...product, id, createdAt, updatedAt };
    const productsCollection = collection(db, "products");

    const docRef = await addDoc(productsCollection, newProduct);
    console.log("Produto adicionado com sucesso!");
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar produto: ", error);
    throw error;
  }
};