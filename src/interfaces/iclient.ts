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
  /** Nome do estado ("São Paulo"). Escrito junto com `uf` via `estadoPatch`. */
  state?: string;
  /** Sigla da UF ("SP") — campo usado para filtrar/exportar. */
  uf?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}