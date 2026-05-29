import type { IBudget, IBudgetCreateInput } from '../Budget.js';

export interface IBudgetService {
  create(userId: number, data: IBudgetCreateInput): Promise<IBudget>;
}
