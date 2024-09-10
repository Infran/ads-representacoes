import { IClient } from "../interfaces/icliente";

export class ClientModel implements IClient {
  constructor(
    public id?: number,
    public name: string = name ? name : 'N/A',
    public email?: string,
    public phone?: string,
    public address?: string,
    public city?: string,
    public state?: string,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}

 