import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

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

export const fetchProducts = async () => {
  const productsCollection = collection(db, "products");
  const productsSnapshot = await getDocs(productsCollection);
  return productsSnapshot.docs.map((doc) => doc.data());
};

export const addProduct = async (product) => {
  const id = await getNextProductId();
  const newProduct = { ...product, id };
  const productsCollection = collection(db, "products");
  const docRef = await addDoc(productsCollection, newProduct);
  return docRef.id;
};