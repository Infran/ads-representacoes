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
import { IProduct } from "../interfaces/iproduct";

// ============================================================================
// FUNÇÕES DE LEITURA
// ============================================================================

/**
 * Busca todos os produtos do Firestore.
 * NOTA: Prefira usar useData().products do DataContext para evitar chamadas desnecessárias.
 * Esta função é usada internamente pelo DataContext para popular o cache.
 */
export const getProducts = async (): Promise<IProduct[]> => {
  const productsCollection = collection(db, "products");
  const productsSnapshot = await getDocs(productsCollection);

  return productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IProduct[];
};

/**
 * Busca um produto pelo ID.
 * @param id - ID do produto
 * @returns Produto encontrado ou null se não existir
 */
export const getProductById = async (id: string): Promise<IProduct | null> => {
  if (!id) {
    console.warn("getProductById chamado com ID vazio");
    return null;
  }

  try {
    const productDoc = doc(db, "products", id);
    const productSnap = await getDoc(productDoc);

    if (!productSnap.exists()) {
      return null;
    }

    return { id: productSnap.id, ...productSnap.data() } as IProduct;
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    throw error;
  }
};

/**
 * @deprecated Use useData().searchProductsLocal() para busca com cache local.
 * Esta função ainda faz chamadas ao Firestore - evite usá-la.
 */
export const searchProducts = async (
  searchTerm: string
): Promise<IProduct[]> => {
  console.warn(
    "[DEPRECATED] searchProducts está deprecated. Use searchProductsLocal do DataContext para evitar reads no Firestore."
  );

  const products = await getProducts();

  if (!searchTerm?.trim()) {
    return products;
  }

  const term = searchTerm.toLowerCase();
  return products.filter(
    (product) =>
      product.name?.toLowerCase().includes(term) ||
      product.ncm?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
  );
};

// ============================================================================
// FUNÇÕES DE ESCRITA
// ============================================================================

/**
 * Gera o próximo ID de produto de forma atômica usando transação.
 * Isso garante que dois requests simultâneos não gerem o mesmo ID.
 * @returns Próximo ID disponível
 */
export const getNextProductId = async (): Promise<number> => {
  const docRef = doc(db, "meta", "lastProductId");

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    const data = docSnap.data();
    const nextId = docSnap.exists() && data ? data.id + 1 : 1;
    transaction.set(docRef, { id: nextId });
    return nextId;
  });
};

/**
 * Valida os dados do produto antes de salvar.
 * @param product - Produto a ser validado
 * @throws Error se os dados forem inválidos
 */
const validateProduct = (product: Partial<IProduct>): void => {
  if (!product.name?.trim()) {
    throw new Error("Nome do produto é obrigatório");
  }
  if (!product.ncm?.trim()) {
    throw new Error("NCM do produto é obrigatório");
  }
  if (product.unitValue === undefined || product.unitValue === null) {
    throw new Error("Valor unitário do produto é obrigatório");
  }
};

/**
 * Adiciona um novo produto ao Firestore.
 * @param product - Dados do produto (sem ID, será gerado automaticamente)
 * @returns Produto criado com ID e timestamps
 * @throws Error se a validação falhar ou ocorrer erro no Firestore
 */
export const addProduct = async (
  product: Omit<IProduct, "id" | "createdAt" | "updatedAt">
): Promise<IProduct> => {
  // Valida os dados
  validateProduct(product);

  // Gera ID único de forma atômica
  const id = await getNextProductId();
  const createdAt = serverTimestamp();
  const updatedAt = serverTimestamp();

  const newProduct = {
    ...product,
    id: id.toString(), // Converte para string para compatibilidade com a interface
    createdAt,
    updatedAt,
  } as IProduct;

  const docRef = doc(db, "products", id.toString());
  await setDoc(docRef, newProduct);

  return newProduct;
};

/**
 * Atualiza um produto existente.
 * Usa updateDoc para atualização parcial, preservando campos não enviados.
 * @param product - Produto com dados atualizados (ID obrigatório)
 * @throws Error se o ID não for fornecido ou ocorrer erro no Firestore
 */
export const updateProduct = async (product: IProduct): Promise<void> => {
  if (!product.id) {
    throw new Error("ID do produto é obrigatório para atualização");
  }

  // Valida os dados
  validateProduct(product);

  const docRef = doc(db, "products", product.id.toString());
  const updatedAt = serverTimestamp();

  // Remove campos undefined antes de enviar
  const cleanedProduct = Object.fromEntries(
    Object.entries(product).filter(([_, value]) => value !== undefined)
  );

  await updateDoc(docRef, { ...cleanedProduct, updatedAt });
};

/**
 * Exclui um produto pelo ID.
 * @param id - ID do produto a ser excluído
 * @throws Error se ocorrer erro no Firestore
 */
export const deleteProduct = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("ID do produto é obrigatório para exclusão");
  }

  const docRef = doc(db, "products", id);
  await deleteDoc(docRef);
};
