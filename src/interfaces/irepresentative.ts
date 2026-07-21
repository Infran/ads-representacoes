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
  /** Nome do estado ("São Paulo"). Escrito junto com `uf` via `estadoPatch`. */
  state?: string;
  /** Sigla da UF ("SP") — campo usado para filtrar/exportar. */
  uf?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp
}