import { IClient } from "../interfaces/iclient";
import { Timestamp } from "firebase/firestore";

export class ClientModel implements IClient {
  constructor(
    public id: string = '',
    public name: string = name ? name : 'N/A',
    public cep: string,
    public email?: string,
    public phone?: string,
    public cnpj?: string,
    public address?: string,
    public city?: string,
    public state?: string,
    public createdAt?: Timestamp,
    public updatedAt?: Timestamp
  ) {}
}

 