import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput } from '../Budget.js';

export interface IBudgetService {
  create(userId: number, data: IBudgetCreateInput): Promise<IBudget>;
  update(userId: number, id: number, data: IBudgetUpdateInput): Promise<IBudget>;
}
