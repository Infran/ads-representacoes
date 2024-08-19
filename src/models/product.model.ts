import { IProduct } from '../interfaces/iproduct';

export class ProductModel implements IProduct {
  constructor(
    public id?: number,
    public name?: string,
    public description?: string,
    public ncm?: string,
    public icms?: string,
    public quantity?: number,
    public unitValue?: number,
    public total?: number
  ) {}
} 
