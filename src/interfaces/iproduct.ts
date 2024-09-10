export interface IProduct {
  id?: number;
  name?: string;
  description?: string;
  ncm?: string;
  icms?: string;
  quantity?: number;
  unitValue?: number;
  total?: number;
  createdAt?: Date;
  updatedAt?: Date;
}