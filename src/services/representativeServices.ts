import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  getDoc,
  limit,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// Tipando o representante para garantir que os dados estejam corretos
import { IRepresentative } from "../interfaces/irepresentative";

export const getRepresentatives = async (): Promise<IRepresentative[]> => {
  const representativesCollection = collection(db, "representatives");
  const representativesSnapshot = await getDocs(representativesCollection);
  return representativesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IRepresentative[]; // Garantindo que os dados correspondem à interface
};

export const searchRepresentatives = async (searchTerm: string): Promise<IRepresentative[]> => {
  const representativesCollection = collection(db, "representatives");
  const representativesQuery = query(representativesCollection, limit(10));

  const representativesSnapshot = await getDocs(representativesQuery);
  const representatives: IRepresentative[] = representativesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IRepresentative[];

  // Filtro case-insensitive por nome
  const filteredRepresentatives = representatives.filter((representative) =>
    representative.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return filteredRepresentatives;
};

export const getNextRepresentativeId = async (): Promise<number> => {
  try {
    const docRef = doc(db, "meta", "lastRepresentativeId");
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
  } catch (error) {
    console.error("Erro ao obter o próximo ID de representante: ", error);
    throw error;
  }
};

export const addRepresentative = async (representative: IRepresentative): Promise<string> => {
  try {
    const id = await getNextRepresentativeId();
    const createdAt = serverTimestamp();
    const updatedAt = serverTimestamp();
    
    const newRepresentative = { ...representative, id, createdAt, updatedAt };
    const representativesCollection = collection(db, "representatives");

    const docRef = await addDoc(representativesCollection, newRepresentative);
    console.log("Representante adicionado com sucesso!");
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar representante: ", error);
    throw error;
  }
};
