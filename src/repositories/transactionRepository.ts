import type { PrismaClient } from '../generated/prisma/client.js';
import { TransactionStatus } from '../generated/prisma/enums.js';
import type { ITransaction, ITransactionCreateInput } from '../interfaces/Transaction.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';

export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly db: PrismaClient) {}

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
}
