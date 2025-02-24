import { ISelectedProducts } from '../components/CreateBudget/CreateBudget';
import { Timestamp } from 'firebase/firestore';
import { IClient } from './iclient';
import { IRepresentative } from './irepresentative';

export interface IBudget {
  id: string;
  client: IClient;
  representative: IRepresentative;
  selectedProducts: ISelectedProducts[];
  estimatedDate: string;
  maxDealDate: string;
  guarantee: string;
  tax?: string;
  shippingTerms: string;
  paymentTerms: string;
  totalValue: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}