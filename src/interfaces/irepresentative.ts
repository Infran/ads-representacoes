import { Timestamp } from "firebase/firestore";
import { IClient } from "./iclient";

export interface IRepresentative {
  id: string;
  client: IClient;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cep?: string;
  address?: string;
  city?: string;
  state?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp
}