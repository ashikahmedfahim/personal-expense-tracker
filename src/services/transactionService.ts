import { FlowType } from '../generated/prisma/enums.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { IBudgetRepository } from '../interfaces/repositories/IBudgetRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import type {
  IDailyExpenseTotal,
  ITransaction,
  ITransactionCreateInput,
  ITransactionDailyAmount,
  ITransactionUpdateInput,
  ITransactionsByCategory,
  ITransactionWithCategory,
} from '../interfaces/Transaction.js';
import type { ITransactionService } from '../interfaces/services/ITransactionService.js';
import { formatUtcDateKey, formatUtcMonthKey, getCurrentMonthUtcRange, getMonthUtcRange, getUtcDateKeysForMonth } from '../utils/date.js';
import { AppError } from '../utils/errors.js';

const RECENT_TRANSACTION_LIMIT = 10;
const CURRENT_MONTH_TRANSACTION_LIMIT = 20;

export class TransactionService implements ITransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async listRecent(userId: number): Promise<ITransaction[]> {
    const transactions: ITransaction[] = await this.transactionRepository.findRecentByUserId(
      userId,
      RECENT_TRANSACTION_LIMIT,
    );
    return transactions;
  }

  async listCurrentMonth(userId: number): Promise<ITransactionsByCategory[]> {
    const { start, end }: { start: Date; end: Date } = getCurrentMonthUtcRange();
    const items: ITransactionWithCategory[] = await this.transactionRepository.findRecentInDateRangeByUserId(
      userId,
      start,
      end,
      CURRENT_MONTH_TRANSACTION_LIMIT,
    );
    return this.groupByCategory(items);
  }

  async getCurrentMonthDailyTotals(userId: number): Promise<IDailyExpenseTotal[]> {
    const referenceDate: Date = new Date();
    const { start, end }: { start: Date; end: Date } = getCurrentMonthUtcRange(referenceDate);
    const amounts: ITransactionDailyAmount[] =
      await this.transactionRepository.findOutflowAmountsInDateRangeByUserId(userId, start, end);

    const totalsByDay = new Map<string, number>();
    for (const { date, amount } of amounts) {
      const dateKey: string = formatUtcDateKey(date);
      totalsByDay.set(dateKey, (totalsByDay.get(dateKey) ?? 0) + amount);
    }

    return getUtcDateKeysForMonth(referenceDate).map((date) => ({
      date,
      total: totalsByDay.get(date) ?? 0,
    }));
  }

  private groupByCategory(items: ITransactionWithCategory[]): ITransactionsByCategory[] {
    const groups = new Map<number, ITransactionsByCategory>();

    for (const item of items) {
      const existing: ITransactionsByCategory | undefined = groups.get(item.category.id);
      if (existing) {
        existing.category.transactions.push(item.transaction);
        continue;
      }

      groups.set(item.category.id, {
        category: {
          id: item.category.id,
          name: item.category.name,
          flowType: item.category.flowType,
          order: item.category.order,
          transactions: [item.transaction],
        },
      });
    }

    return [...groups.values()].sort((a, b) => a.category.order - b.category.order);
  }

  async create(userId: number, data: ITransactionCreateInput): Promise<ITransaction> {
    const category = await this.categoryRepository.findByIdAndUserId(data.categoryId, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const transactionDate: Date = data.date ?? new Date();
    await this.ensureBudgetedTransactionWithinLimit(userId, category, transactionDate, data.amount);

    const transaction: ITransaction = await this.transactionRepository.create(userId, data);
    return transaction;
  }

  async update(userId: number, id: number, data: ITransactionUpdateInput): Promise<ITransaction> {
    const existing: ITransaction | null = await this.transactionRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new AppError(404, 'Transaction not found');
    }

    const categoryId: number = data.categoryId ?? existing.categoryId;
    const category = await this.categoryRepository.findByIdAndUserId(categoryId, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const transactionDate: Date = data.date ?? existing.date;
    const amount: number = data.amount ?? existing.amount;

    if (
      (category.flowType === FlowType.OUTFLOW || category.flowType === FlowType.SAVINGS) &&
      (data.amount !== undefined || data.categoryId !== undefined || data.date !== undefined)
    ) {
      await this.ensureBudgetedTransactionWithinLimit(userId, category, transactionDate, amount, existing);
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

  private async ensureBudgetedTransactionWithinLimit(
    userId: number,
    category: { id: number; flowType: FlowType },
    referenceDate: Date,
    amount: number,
    existingTransaction?: ITransaction,
  ): Promise<void> {
    if (category.flowType !== FlowType.OUTFLOW && category.flowType !== FlowType.SAVINGS) {
      return;
    }

    const { start, end }: { start: Date; end: Date } = getMonthUtcRange(referenceDate);
    const budget = await this.budgetRepository.findByCategoryIdAndUserIdInMonth(
      userId,
      category.id,
      start,
      end,
    );

    if (!budget) {
      throw new AppError(400, 'Budget must be created for this category in the transaction month before adding a transaction');
    }

    const excludeTransactionId: number | undefined =
      existingTransaction &&
      existingTransaction.categoryId === category.id &&
      formatUtcMonthKey(existingTransaction.date) === formatUtcMonthKey(referenceDate)
        ? existingTransaction.id
        : undefined;

    const currentSpent: number = await this.transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId(
      userId,
      category.id,
      category.flowType,
      start,
      end,
      excludeTransactionId,
    );

    if (currentSpent + amount > budget.amount) {
      throw new AppError(400, 'Transaction would exceed the budget limit for this category in the transaction month');
    }
  }
}
