import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput, ICurrentMonthBudgetOverview, IOverallBudgetView } from '../Budget.js';

export interface IBudgetService {
  create(userId: number, data: IBudgetCreateInput): Promise<IBudget>;
  getCurrentMonthOverview(userId: number): Promise<ICurrentMonthBudgetOverview>;
  getCurrentMonthOverall(userId: number): Promise<IOverallBudgetView>;
  update(userId: number, id: number, data: IBudgetUpdateInput): Promise<IBudget>;
  delete(userId: number, id: number): Promise<void>;
}
