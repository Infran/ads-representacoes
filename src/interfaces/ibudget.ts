import { ISelectedProduct } from '../components/CreateBudget/CreateBudget';
import { IClient } from './iclient';

export interface IBudget {
  id?: number;
  client: IClient;
  products: ISelectedProduct[];
  estimatedDate: string;
  maxDealDate: string;
  guarantee: string;
  tax?: string;
  totalValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}