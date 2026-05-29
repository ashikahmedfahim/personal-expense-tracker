import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import type { ITransaction, ITransactionCreateInput } from '../interfaces/Transaction.js';
import type { ITransactionService } from '../interfaces/services/ITransactionService.js';
import { AppError } from '../utils/errors.js';

export class TransactionService implements ITransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async create(userId: number, data: ITransactionCreateInput): Promise<ITransaction> {
    const category = await this.categoryRepository.findByIdAndUserId(data.categoryId, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const transaction: ITransaction = await this.transactionRepository.create(userId, data);
    return transaction;
  }
}
