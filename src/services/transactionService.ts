import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import type {
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
} from '../interfaces/Transaction.js';
import type { ITransactionService } from '../interfaces/services/ITransactionService.js';
import { AppError } from '../utils/errors.js';

const RECENT_TRANSACTION_LIMIT = 10;

export class TransactionService implements ITransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async listRecent(userId: number): Promise<ITransaction[]> {
    const transactions: ITransaction[] = await this.transactionRepository.findRecentByUserId(
      userId,
      RECENT_TRANSACTION_LIMIT,
    );
    return transactions;
  }

  async create(userId: number, data: ITransactionCreateInput): Promise<ITransaction> {
    const category = await this.categoryRepository.findByIdAndUserId(data.categoryId, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const transaction: ITransaction = await this.transactionRepository.create(userId, data);
    return transaction;
  }

  async update(userId: number, id: number, data: ITransactionUpdateInput): Promise<ITransaction> {
    if (data.categoryId !== undefined) {
      const category = await this.categoryRepository.findByIdAndUserId(data.categoryId, userId);
      if (!category) {
        throw new AppError(404, 'Category not found');
      }
    }

    const transaction: ITransaction | null = await this.transactionRepository.update(id, userId, data);
    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }
    return transaction;
  }

  async delete(userId: number, id: number): Promise<void> {
    const transaction: ITransaction | null = await this.transactionRepository.delete(id, userId);
    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }
  }
}
