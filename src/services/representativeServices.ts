import {
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc,
  limit,
  query,
  serverTimestamp,
  deleteDoc,
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

export const addRepresentative = async (representative: IRepresentative): Promise<void> => {
  try {
    const id = await getNextRepresentativeId();
    const createdAt = serverTimestamp();
    const updatedAt = serverTimestamp();
    
    const newRepresentative = { ...representative, id, createdAt, updatedAt };

    const docRef = doc(db, "representatives", id.toString());
    await setDoc(docRef, newRepresentative);

    console.log("Representante adicionado com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar representante: ", error);
    throw error;
  }
};

export const getRepresentativeById = async (id: string): Promise<IRepresentative | null> => {
  try {
    const representativeDoc = doc(db, "representatives", id);
    const representativeSnap = await getDoc(representativeDoc);

    if (!representativeSnap.exists()) {
      console.log("Documento não encontrado");
      return null;
    }

    return { id: representativeSnap.id, ...representativeSnap.data() } as IRepresentative;
  } catch (error) {
    console.error("Erro ao buscar representante: ", error);
    throw error;
  }
};

export const updateRepresentative = async (representative: IRepresentative): Promise<void> => {
  try {
    const docRef = doc(db, "representatives", representative.id.toString());
    await setDoc(docRef, representative);
    console.log("Representante atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar representante: ", error);
    throw error;
  }
};

export const deleteRepresentative = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "representatives", id.toString());
    await deleteDoc(docRef);
    console.log("Representante excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir representante: ", error);
    throw error;
  }
};