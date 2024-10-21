import { IBudget } from "../interfaces/ibudget";

export class BudgetModel implements IBudget {
  constructor(
    public client,
    public products,
    public estimatedDate,
    public maxDealDate,
    public guarantee,
    public tax,
    public total,
    public createdAt,
    public updatedAt = new Date()
  ) {}
}