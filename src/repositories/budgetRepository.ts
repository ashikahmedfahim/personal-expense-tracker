import type { PrismaClient } from '../generated/prisma/client.js';
import type { IBudget, IBudgetCreateInput } from '../interfaces/Budget.js';
import type { IBudgetRepository } from '../interfaces/repositories/IBudgetRepository.js';

export class BudgetRepository implements IBudgetRepository {
  constructor(private readonly db: PrismaClient) {}

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
}
