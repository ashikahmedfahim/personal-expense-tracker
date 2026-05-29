import type { IBudget, IBudgetCreateInput } from '../Budget.js';

export interface IBudgetRepository {
  findByIdAndUserId(id: number, userId: number): Promise<IBudget | null>;
  findByCategoryIdAndUserIdInMonth(
    userId: number,
    categoryId: number,
    start: Date,
    end: Date,
  ): Promise<IBudget | null>;
  create(userId: number, data: IBudgetCreateInput, date: Date): Promise<IBudget>;
  update(id: number, userId: number, amount: number): Promise<IBudget | null>;
}
