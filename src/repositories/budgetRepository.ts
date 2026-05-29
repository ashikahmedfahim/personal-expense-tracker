import type { PrismaClient } from '../generated/prisma/client.js';
import type { IBudget, IBudgetCreateInput } from '../interfaces/Budget.js';
import type { IBudgetRepository } from '../interfaces/repositories/IBudgetRepository.js';

export class BudgetRepository implements IBudgetRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByIdAndUserId(id: number, userId: number): Promise<IBudget | null> {
    const response: IBudget | null = await this.db.budget.findFirst({
      where: { id, userId },
    });
    return response;
  }

  async findByCategoryIdAndUserIdInMonth(
    userId: number,
    categoryId: number,
    start: Date,
    end: Date,
  ): Promise<IBudget | null> {
    const response: IBudget | null = await this.db.budget.findFirst({
      where: {
        userId,
        categoryId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });
    return response;
  }

  async create(userId: number, data: IBudgetCreateInput, date: Date): Promise<IBudget> {
    const response: IBudget = await this.db.budget.create({
      data: {
        amount: data.amount,
        categoryId: data.categoryId,
        userId,
        date,
      },
    });
    return response;
  }

  async update(id: number, userId: number, amount: number): Promise<IBudget | null> {
    const existing: IBudget | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const response: IBudget = await this.db.budget.update({
      where: { id },
      data: { amount },
    });
    return response;
  }

  async delete(id: number, userId: number): Promise<IBudget | null> {
    const existing: IBudget | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const response: IBudget = await this.db.budget.delete({
      where: { id },
    });
    return response;
  }
}
