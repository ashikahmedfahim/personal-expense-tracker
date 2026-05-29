import type { PrismaClient } from '../generated/prisma/client.js';
import { TransactionStatus } from '../generated/prisma/enums.js';
import type {
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
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
