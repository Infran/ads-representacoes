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
import { IClient } from "../interfaces/iclient";

// ============================================================================
// FUNÇÕES DE LEITURA
// ============================================================================

/**
 * Busca todos os clientes do Firestore.
 * NOTA: Prefira usar useData().clients do DataContext para evitar chamadas desnecessárias.
 * Esta função é usada internamente pelo DataContext para popular o cache.
 */
export const getClients = async (): Promise<IClient[]> => {
  const clientsCollection = collection(db, "clients");
  const clientsSnapshot = await getDocs(clientsCollection);

  return clientsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IClient[];
};

/**
 * Busca um cliente pelo ID.
 * @param id - ID do cliente
 * @returns Cliente encontrado ou null se não existir
 */
export const getClientById = async (id: string): Promise<IClient | null> => {
  if (!id) {
    console.warn("getClientById chamado com ID vazio");
    return null;
  }

  try {
    const clientDoc = doc(db, "clients", id);
    const clientSnap = await getDoc(clientDoc);

    if (!clientSnap.exists()) {
      return null;
    }

    return { id: clientSnap.id, ...clientSnap.data() } as IClient;
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    throw error;
  }
};

/**
 * @deprecated Use useData().searchClientsLocal() para busca com cache local.
 * Esta função ainda faz chamadas ao Firestore - evite usá-la.
 */
export const searchClients = async (searchTerm: string): Promise<IClient[]> => {
  console.warn(
    "[DEPRECATED] searchClients está deprecated. Use searchClientsLocal do DataContext para evitar reads no Firestore."
  );

  const clients = await getClients();

  if (!searchTerm?.trim()) {
    return clients;
  }

  const term = searchTerm.toLowerCase();
  return clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone?.toLowerCase().includes(term) ||
      client.cnpj?.toLowerCase().includes(term)
  );
};

// ============================================================================
// FUNÇÕES DE ESCRITA
// ============================================================================

/**
 * Gera o próximo ID de cliente de forma atômica usando transação.
 * Isso garante que dois requests simultâneos não gerem o mesmo ID.
 * @returns Próximo ID disponível
 */
export const getNextClientId = async (): Promise<number> => {
  const docRef = doc(db, "meta", "lastClientId");

  return runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    const data = docSnap.data();
    const nextId = docSnap.exists() && data ? data.id + 1 : 1;
    transaction.set(docRef, { id: nextId });
    return nextId;
  });
};

/**
 * Valida os dados do cliente antes de salvar.
 * @param client - Cliente a ser validado
 * @throws Error se os dados forem inválidos
 */
const validateClient = (client: Partial<IClient>): void => {
  if (!client.name?.trim()) {
    throw new Error("Nome do cliente é obrigatório");
  }
  if (!client.cep?.trim()) {
    throw new Error("CEP do cliente é obrigatório");
  }
};

/**
 * Adiciona um novo cliente ao Firestore.
 * @param client - Dados do cliente (sem ID, será gerado automaticamente)
 * @returns Cliente criado com ID e timestamps
 * @throws Error se a validação falhar ou ocorrer erro no Firestore
 */
export const addClient = async (
  client: Omit<IClient, "id" | "createdAt" | "updatedAt">
): Promise<IClient> => {
  // Valida os dados
  validateClient(client);

  // Gera ID único de forma atômica
  const id = await getNextClientId();
  const createdAt = serverTimestamp();
  const updatedAt = serverTimestamp();

  const newClient = {
    ...client,
    id: id.toString(), // Converte para string para compatibilidade com a interface
    createdAt,
    updatedAt,
  } as IClient;

  const docRef = doc(db, "clients", id.toString());
  await setDoc(docRef, newClient);

  return newClient;
};

/**
 * Atualiza um cliente existente.
 * Usa updateDoc para atualização parcial, preservando campos não enviados.
 * @param client - Cliente com dados atualizados (ID obrigatório)
 * @throws Error se o ID não for fornecido ou ocorrer erro no Firestore
 */
export const updateClient = async (client: IClient): Promise<void> => {
  if (!client.id) {
    throw new Error("ID do cliente é obrigatório para atualização");
  }

  // Valida os dados
  validateClient(client);

  const docRef = doc(db, "clients", client.id.toString());
  const updatedAt = serverTimestamp();

  // Remove campos undefined antes de enviar
  const cleanedClient = Object.fromEntries(
    Object.entries(client).filter(([_, value]) => value !== undefined)
  );

  await updateDoc(docRef, { ...cleanedClient, updatedAt });
};

/**
 * Exclui um cliente pelo ID.
 * @param id - ID do cliente a ser excluído
 * @throws Error se ocorrer erro no Firestore
 */
export const deleteClient = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("ID do cliente é obrigatório para exclusão");
  }

  const docRef = doc(db, "clients", id);
  await deleteDoc(docRef);
};
