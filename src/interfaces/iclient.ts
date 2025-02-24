import { Timestamp } from "firebase/firestore";

export interface IClient {
  id: string
  name: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  cep: string;
  address?: string;
  city?: string;
  state?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}