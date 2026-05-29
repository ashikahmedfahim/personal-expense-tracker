import type { IBudget, IBudgetCreateInput } from '../Budget.js';

export interface IBudgetRepository {
  findByCategoryIdAndUserIdInMonth(
    userId: number,
    categoryId: number,
    start: Date,
    end: Date,
  ): Promise<IBudget | null>;
  create(userId: number, data: IBudgetCreateInput, date: Date): Promise<IBudget>;
}
