import {
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc,
  limit,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { IClient } from "../interfaces/iclient";

// Tipando a função de buscar clientes
export const getClients = async (): Promise<IClient[]> => {
  const clientsCollection = collection(db, "clients");
  const clientsSnapshot = await getDocs(clientsCollection);

  return clientsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IClient[];
};

// Função de busca de clientes com filtro
export const searchClients = async (searchTerm: string) => {
  const clientsCollection = collection(db, "clients");
  const clientsQuery = query(clientsCollection, limit(10)); // Limita a 10 clientes

  const clientsSnapshot = await getDocs(clientsQuery);
  const clients: IClient[] = clientsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IClient[];

  // Filtrando os clientes com base no termo de busca
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email &&
        client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone &&
        client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return filteredClients;
};

// Função para buscar um cliente pelo ID
export const getClientById = async (id: string): Promise<IClient | null> => {
  try {
    const clientDoc = doc(db, "clients", id);
    const clientSnap = await getDoc(clientDoc);

    if (!clientSnap.exists()) {
      console.log("Documento não encontrado");
      return null; // Retorna null se o documento não existir
    }

    return { id: clientSnap.id, ...clientSnap.data() } as IClient;
  } catch (error) {
    console.error("Erro ao buscar cliente: ", error);
    throw error; // Rejeita a promessa para que o chamador possa lidar com o erro
  }
};

// Função para obter o próximo ID de cliente
export const getNextClientId = async (): Promise<number> => {
  const docRef = doc(db, "meta", "lastClientId");
  const docSnap = await getDoc(docRef);

  const nextId = docSnap.exists() ? docSnap.data().id + 1 : 1;
  await setDoc(docRef, { id: nextId });

  return nextId;
};

// Função para adicionar um novo cliente
export const addClient = async (client: IClient): Promise<void> => {
  try {
    const id = await getNextClientId();
    const createdAt = serverTimestamp();
    const updatedAt = serverTimestamp();

    const newClient = { ...client, id, createdAt, updatedAt };

    const docRef = doc(db, "clients", id.toString());
    await setDoc(docRef, newClient);

    console.log("Cliente adicionado com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar cliente: ", error);
  }
};

// Função para atualizar um cliente

export const updateClient = async (client: IClient): Promise<void> => {
  try {
    const docRef = doc(db, "clients", client.id.toString());
    await setDoc(docRef, client);
    console.log("Cliente atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar cliente: ", error);
  }
};
