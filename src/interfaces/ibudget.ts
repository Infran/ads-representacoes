import { Timestamp } from "firebase/firestore";
import { IClient } from "./iclient";
import { IRepresentative } from "./irepresentative";
import { IProduct } from "./iproduct";

export interface ISelectedProducts {
  product: IProduct;
  quantity: number;
  customUnitValue?: number; // Valor customizado local para este orçamento (não altera o produto base)
}

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
  reference: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
