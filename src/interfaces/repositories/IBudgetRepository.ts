import type { IBudget, IBudgetCreateInput, IBudgetWithCategory } from '../Budget.js';

export interface IBudgetRepository {
  findByIdAndUserId(id: number, userId: number): Promise<IBudget | null>;
  findByCategoryIdAndUserIdInMonth(
    userId: number,
    categoryId: number,
    start: Date,
    end: Date,
  ): Promise<IBudget | null>;
  findAllByUserIdInMonth(userId: number, start: Date, end: Date): Promise<IBudgetWithCategory[]>;
  create(userId: number, data: IBudgetCreateInput, date: Date): Promise<IBudget>;
  update(id: number, userId: number, amount: number): Promise<IBudget | null>;
  delete(id: number, userId: number): Promise<IBudget | null>;
}
