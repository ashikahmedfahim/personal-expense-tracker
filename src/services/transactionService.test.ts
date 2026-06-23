import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowType, TransactionStatus } from '../generated/prisma/enums.js';
import type { ICategory } from '../interfaces/Category.js';
import type { IBudget } from '../interfaces/Budget.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { IBudgetRepository } from '../interfaces/repositories/IBudgetRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import type {
  IDailyExpenseTotal,
  ICurrentMonthTransactionOverview,
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
  ITransactionsByCategory,
} from '../interfaces/Transaction.js';
import { AppError } from '../utils/errors.js';
import { TransactionService } from './transactionService.js';

const userId = 1;

const category: ICategory = {
  id: 3,
  name: 'Food',
  flowType: FlowType.OUTFLOW,
  order: 1,
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const createInput: ITransactionCreateInput = {
  title: 'Coffee',
  amount: 4.5,
  categoryId: 3,
};

const updateInput: ITransactionUpdateInput = {
  title: 'Lunch',
  amount: 12,
};

const transaction: ITransaction = {
  id: 20,
  title: 'Coffee',
  amount: 4.5,
  description: null,
  date: new Date('2024-06-01T10:00:00.000Z'),
  status: TransactionStatus.COMPLETED,
  categoryId: 3,
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const budget: IBudget = {
  id: 1,
  amount: 500,
  date: new Date('2024-06-01T00:00:00.000Z'),
  categoryId: 3,
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('TransactionService', () => {
  let transactionRepository: ITransactionRepository;
  let categoryRepository: ICategoryRepository;
  let budgetRepository: IBudgetRepository;
  let transactionService: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();

    transactionRepository = {
      findRecentByUserId: vi.fn(),
      findRecentInDateRangeByUserId: vi.fn(),
      findOutflowAmountsInDateRangeByUserId: vi.fn(),
      sumOutflowByCategoryInDateRangeByUserId: vi.fn(),
      sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId: vi.fn(),
      sumOutflowAmountByCategoryIdInDateRangeByUserId: vi.fn(),
      sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId: vi.fn(),
      sumCompletedAmountByFlowTypeInDateRangeByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    categoryRepository = {
      findAllByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      getLastOrderByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateOrders: vi.fn(),
      delete: vi.fn(),
    };

    budgetRepository = {
      findByIdAndUserId: vi.fn(),
      findByCategoryIdAndUserIdInMonth: vi.fn(),
      findAllByUserIdInMonth: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    transactionService = new TransactionService(transactionRepository, categoryRepository, budgetRepository);
  });

  describe('listRecent', () => {
    it('returns the last 10 transactions for the user', async () => {
      vi.mocked(transactionRepository.findRecentByUserId).mockResolvedValue([transaction]);

      const result: ITransaction[] = await transactionService.listRecent(userId);

      expect(transactionRepository.findRecentByUserId).toHaveBeenCalledWith(userId, 10);
      expect(result).toEqual([transaction]);
    });
  });

  describe('listCurrentMonth', () => {
    const foodCategory = {
      id: category.id,
      name: category.name,
      flowType: category.flowType,
      order: category.order,
    };

    const transportCategory = {
      id: 5,
      name: 'Transport',
      flowType: FlowType.OUTFLOW,
      order: 2,
    };

    const transportTransaction: ITransaction = {
      ...transaction,
      id: 21,
      title: 'Bus',
      categoryId: transportCategory.id,
    };

    it('returns up to 20 current-month transactions nested under each category', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
      vi.mocked(transactionRepository.findRecentInDateRangeByUserId).mockResolvedValue([
        { transaction: transportTransaction, category: transportCategory },
        { transaction, category: foodCategory },
      ]);

      const result: ITransactionsByCategory[] = await transactionService.listCurrentMonth(userId);

      expect(transactionRepository.findRecentInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
        20,
      );
      expect(result).toEqual([
        {
          category: {
            ...foodCategory,
            transactions: [transaction],
          },
        },
        {
          category: {
            ...transportCategory,
            transactions: [transportTransaction],
          },
        },
      ]);
      vi.useRealTimers();
    });
  });

  describe('getCurrentMonthOverview', () => {
    const incomeCategory: ICategory = {
      ...category,
      id: 4,
      name: 'Salary',
      flowType: FlowType.INFLOW,
      order: 0,
    };

    it('returns current month transaction totals only', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId)
        .mockImplementation(async (_userId, flowType) => {
          if (flowType === FlowType.INFLOW) return [{ categoryId: 4, total: 17000 }];
          if (flowType === FlowType.OUTFLOW) return [{ categoryId: 3, total: 12000 }];
          return [];
        });
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId)
        .mockImplementation(async (_userId, flowType) => {
          if (flowType === FlowType.INFLOW) return 17000;
          if (flowType === FlowType.OUTFLOW) return 12000;
          return 0;
        });
      vi.mocked(categoryRepository.findByIdAndUserId).mockImplementation(async (id) => {
        if (id === 4) return incomeCategory;
        if (id === 3) return category;
        return null;
      });

      const result: ICurrentMonthTransactionOverview = await transactionService.getCurrentMonthOverview(userId);

      expect(result).toEqual({
        month: '2024-06',
        summary: {
          totalIncome: 17000,
          totalExpenses: 12000,
          totalSavings: 0,
          netBalance: 5000,
        },
        categories: [
          {
            category: {
              id: 4,
              name: 'Salary',
              flowType: FlowType.INFLOW,
              order: 0,
            },
            total: 17000,
          },
          {
            category: {
              id: 3,
              name: 'Food',
              flowType: FlowType.OUTFLOW,
              order: 1,
            },
            total: 12000,
          },
        ],
      });
      vi.useRealTimers();
    });
  });

  describe('getCurrentMonthDailyTotals', () => {
    it('returns daily outflow totals for every day in the current UTC month', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
      vi.mocked(transactionRepository.findOutflowAmountsInDateRangeByUserId).mockResolvedValue([
        { date: new Date('2024-06-01T10:00:00.000Z'), amount: 4.5 },
        { date: new Date('2024-06-01T18:00:00.000Z'), amount: 10 },
        { date: new Date('2024-06-03T08:00:00.000Z'), amount: 25 },
      ]);

      const result: IDailyExpenseTotal[] = await transactionService.getCurrentMonthDailyTotals(userId);

      expect(transactionRepository.findOutflowAmountsInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(result).toHaveLength(30);
      expect(result[0]).toEqual({ date: '2024-06-01', total: 14.5 });
      expect(result[1]).toEqual({ date: '2024-06-02', total: 0 });
      expect(result[2]).toEqual({ date: '2024-06-03', total: 25 });
      vi.useRealTimers();
    });
  });

  describe('create', () => {
    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(transactionService.create(userId, createInput)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('throws when outflow category has no budget for the transaction month', async () => {
      const input: ITransactionCreateInput = {
        ...createInput,
        date: new Date('2024-06-01T10:00:00.000Z'),
      };
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(category);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(null);

      await expect(transactionService.create(userId, input)).rejects.toEqual(
        new AppError(400, 'Budget must be created for this category in the transaction month before adding a transaction'),
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('throws when outflow transaction would exceed the budget limit', async () => {
      const input: ITransactionCreateInput = {
        ...createInput,
        amount: 50,
        date: new Date('2024-06-01T10:00:00.000Z'),
      };
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(category);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(budget);
      vi.mocked(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).mockResolvedValue(460);

      await expect(transactionService.create(userId, input)).rejects.toEqual(
        new AppError(400, 'Transaction would exceed the budget limit for this category in the transaction month'),
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('creates a transaction when outflow category has a budget for the transaction month', async () => {
      const input: ITransactionCreateInput = {
        ...createInput,
        date: new Date('2024-06-01T10:00:00.000Z'),
      };
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(category);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(budget);
      vi.mocked(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).mockResolvedValue(100);
      vi.mocked(transactionRepository.create).mockResolvedValue(transaction);

      const result: ITransaction = await transactionService.create(userId, input);

      expect(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        category.id,
        FlowType.OUTFLOW,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
        undefined,
      );
      expect(budgetRepository.findByCategoryIdAndUserIdInMonth).toHaveBeenCalledWith(
        userId,
        category.id,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(categoryRepository.findByIdAndUserId).toHaveBeenCalledWith(input.categoryId, userId);
      expect(transactionRepository.create).toHaveBeenCalledWith(userId, input);
      expect(result).toEqual(transaction);
    });

    it('creates a transaction for inflow categories without requiring a budget', async () => {
      const inflowCategory: ICategory = { ...category, id: 7, flowType: FlowType.INFLOW };
      const inflowInput: ITransactionCreateInput = { ...createInput, categoryId: 7 };
      const inflowTransaction: ITransaction = { ...transaction, categoryId: 7 };

      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(inflowCategory);
      vi.mocked(transactionRepository.create).mockResolvedValue(inflowTransaction);

      const result: ITransaction = await transactionService.create(userId, inflowInput);

      expect(budgetRepository.findByCategoryIdAndUserIdInMonth).not.toHaveBeenCalled();
      expect(result).toEqual(inflowTransaction);
    });
  });

  describe('update', () => {
    it('throws when transaction is not found', async () => {
      vi.mocked(transactionRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(transactionService.update(userId, transaction.id, updateInput)).rejects.toEqual(
        new AppError(404, 'Transaction not found'),
      );
      expect(transactionRepository.update).not.toHaveBeenCalled();
    });

    it('throws when category is not found', async () => {
      vi.mocked(transactionRepository.findByIdAndUserId).mockResolvedValue(transaction);
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        transactionService.update(userId, transaction.id, { categoryId: 99 }),
      ).rejects.toEqual(new AppError(404, 'Category not found'));
      expect(transactionRepository.update).not.toHaveBeenCalled();
    });

    it('throws when changing to an outflow category without a budget for the transaction month', async () => {
      vi.mocked(transactionRepository.findByIdAndUserId).mockResolvedValue(transaction);
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue({ ...category, id: 5 });
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(null);

      await expect(
        transactionService.update(userId, transaction.id, { categoryId: 5 }),
      ).rejects.toEqual(
        new AppError(400, 'Budget must be created for this category in the transaction month before adding a transaction'),
      );
      expect(transactionRepository.update).not.toHaveBeenCalled();
    });

    it('throws when updating amount would exceed the budget limit', async () => {
      vi.mocked(transactionRepository.findByIdAndUserId).mockResolvedValue(transaction);
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(category);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(budget);
      vi.mocked(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).mockResolvedValue(490);

      await expect(
        transactionService.update(userId, transaction.id, { amount: 20 }),
      ).rejects.toEqual(
        new AppError(400, 'Transaction would exceed the budget limit for this category in the transaction month'),
      );
      expect(transactionRepository.update).not.toHaveBeenCalled();
    });

    it('updates a transaction when it exists', async () => {
      const updated: ITransaction = { ...transaction, title: 'Lunch', amount: 12 };
      vi.mocked(transactionRepository.findByIdAndUserId).mockResolvedValue(transaction);
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(category);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(budget);
      vi.mocked(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).mockResolvedValue(100);
      vi.mocked(transactionRepository.update).mockResolvedValue(updated);

      const result: ITransaction = await transactionService.update(userId, transaction.id, updateInput);

      expect(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        category.id,
        FlowType.OUTFLOW,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
        transaction.id,
      );
      expect(transactionRepository.update).toHaveBeenCalledWith(transaction.id, userId, updateInput);
      expect(result).toEqual(updated);
    });

    it('validates category and budget when categoryId is provided', async () => {
      const updated: ITransaction = { ...transaction, categoryId: 5 };
      vi.mocked(transactionRepository.findByIdAndUserId).mockResolvedValue(transaction);
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue({
        ...category,
        id: 5,
      });
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(budget);
      vi.mocked(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).mockResolvedValue(0);
      vi.mocked(transactionRepository.update).mockResolvedValue(updated);

      const result: ITransaction = await transactionService.update(userId, transaction.id, { categoryId: 5 });

      expect(categoryRepository.findByIdAndUserId).toHaveBeenCalledWith(5, userId);
      expect(budgetRepository.findByCategoryIdAndUserIdInMonth).toHaveBeenCalledWith(
        userId,
        5,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(transactionRepository.sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        5,
        FlowType.OUTFLOW,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
        undefined,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('throws when transaction is not found', async () => {
      vi.mocked(transactionRepository.delete).mockResolvedValue(null);

      await expect(transactionService.delete(userId, transaction.id)).rejects.toEqual(
        new AppError(404, 'Transaction not found'),
      );
    });

    it('deletes the transaction when it exists', async () => {
      vi.mocked(transactionRepository.delete).mockResolvedValue(transaction);

      await expect(transactionService.delete(userId, transaction.id)).resolves.toBeUndefined();
      expect(transactionRepository.delete).toHaveBeenCalledWith(transaction.id, userId);
    });
  });
});
