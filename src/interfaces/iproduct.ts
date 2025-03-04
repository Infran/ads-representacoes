import { Timestamp } from "firebase/firestore";

export interface IProduct {
  id: string;
  name?: string;
  description?: string;
  ncm?: string;
  icms?: string;
  // quantity?: string;
  unitValue?: number 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}



  
