import { IClient } from './iclient';
import { IProduct } from './iproduct';

export interface IBudget {
  id?: number;
  client: IClient;
  products: IProduct[];
  estimatedDate: string;
  maxDealDate: string;
  guarantee: string;
  tax?: string;
  totalValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}