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

    const docRef = doc(db, "products", id.toString());
    await setDoc(docRef, newProduct);
    
  } catch (error) {
    console.error("Erro ao adicionar produto: ", error);
    throw error;
  }
};

export const getProductById = async (id: string): Promise<IProduct | null> => {
  try {
    const productDoc = doc(db, "products", id);
    const productSnap = await getDoc(productDoc);

    if (!productSnap.exists()) {
      console.log("Documento não encontrado");
      return null;
    }

    return { id: productSnap.id, ...productSnap.data() } as IProduct;
  } catch (error) {
    console.error("Erro ao buscar produto: ", error);
    throw error;
  }
};

export const updateProduct = async (product: IProduct) => {
  try {
    const updatedAt = serverTimestamp();
    const updatedProduct = { ...product, updatedAt };
    const productDoc = doc(db, "products", product.id.toString());
    await setDoc(productDoc, updatedProduct);
    console.log("Produto atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar produto: ", error);
    throw error;
  }
};