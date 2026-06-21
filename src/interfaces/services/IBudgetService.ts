import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput, ICurrentMonthBudgetOverview } from '../Budget.js';

export interface IBudgetService {
  create(userId: number, data: IBudgetCreateInput): Promise<IBudget>;
  getCurrentMonthOverview(userId: number): Promise<ICurrentMonthBudgetOverview>;
  update(userId: number, id: number, data: IBudgetUpdateInput): Promise<IBudget>;
  delete(userId: number, id: number): Promise<void>;
}
