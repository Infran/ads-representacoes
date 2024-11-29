import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export const fetchClients = async () => {
  const clientsCollection = collection(db, "clients");
  const clientsSnapshot = await getDocs(clientsCollection);
  return clientsSnapshot.docs.map((doc) => doc.data());
};

export const searchClients = async (searchTerm) => {
  const clientsCollection = collection(db, "clients");
  const clientsSnapshot = await getDocs(clientsCollection);
  const clients = clientsSnapshot.docs.map((doc) => doc.data());
  return clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const getNextClientId = async () => {
  const docRef = doc(db, "meta", "lastClientId");
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

export const addClient = async (client) => {
  const id = await getNextClientId();
  const newClient = { ...client, id };
  const clientsCollection = collection(db, "clients");
  const docRef = await addDoc(clientsCollection, newClient);
  return docRef.id;
};
