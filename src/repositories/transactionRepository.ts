import type { PrismaClient } from '../generated/prisma/client.js';
import { FlowType, TransactionStatus } from '../generated/prisma/enums.js';
import type {
  ICategorySpendingTotal,
  ITransaction,
  ITransactionCreateInput,
  ITransactionDailyAmount,
  ITransactionUpdateInput,
  ITransactionWithCategory,
} from '../interfaces/Transaction.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';

export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findRecentByUserId(userId: number, limit: number): Promise<ITransaction[]> {
    const response: ITransaction[] = await this.db.transaction.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return response;
  }

  async findRecentInDateRangeByUserId(
    userId: number,
    start: Date,
    end: Date,
    limit: number,
  ): Promise<ITransactionWithCategory[]> {
    const rows = await this.db.transaction.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        title: true,
        amount: true,
        description: true,
        date: true,
        status: true,
        categoryId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            flowType: true,
            order: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    const response: ITransactionWithCategory[] = rows.map(({ category, ...transaction }) => ({
      transaction,
      category,
    }));
    return response;
  }

  async findOutflowAmountsInDateRangeByUserId(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<ITransactionDailyAmount[]> {
    const response: ITransactionDailyAmount[] = await this.db.transaction.findMany({
      where: {
        userId,
        status: TransactionStatus.COMPLETED,
        date: {
          gte: start,
          lte: end,
        },
        category: {
          flowType: FlowType.OUTFLOW,
        },
      },
      select: {
        date: true,
        amount: true,
      },
    });
    return response;
  }

  async sumOutflowByCategoryInDateRangeByUserId(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<ICategorySpendingTotal[]> {
    const rows = await this.db.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        status: TransactionStatus.COMPLETED,
        date: {
          gte: start,
          lte: end,
        },
        category: {
          flowType: FlowType.OUTFLOW,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const response: ICategorySpendingTotal[] = rows.map((row) => ({
      categoryId: row.categoryId,
      total: row._sum.amount ?? 0,
    }));
    return response;
  }

  async findByIdAndUserId(id: number, userId: number): Promise<ITransaction | null> {
    const response: ITransaction | null = await this.db.transaction.findFirst({
      where: { id, userId },
    });
    return response;
  }

  async create(userId: number, data: ITransactionCreateInput): Promise<ITransaction> {
    const response: ITransaction = await this.db.transaction.create({
      data: {
        ...data,
        userId,
        status: TransactionStatus.COMPLETED,
      },
    });
    return response;
  }

  async update(id: number, userId: number, data: ITransactionUpdateInput): Promise<ITransaction | null> {
    const existing: ITransaction | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const response: ITransaction = await this.db.transaction.update({
      where: { id },
      data,
    });
    return response;
  }

  async delete(id: number, userId: number): Promise<ITransaction | null> {
    const existing: ITransaction | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const response: ITransaction = await this.db.transaction.delete({
      where: { id },
    });
    return response;
  }
}
