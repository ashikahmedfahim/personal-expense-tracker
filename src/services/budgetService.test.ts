import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowType } from '../generated/prisma/enums.js';
import type { ICategory } from '../interfaces/Category.js';
import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput, ICurrentMonthBudgetOverview } from '../interfaces/Budget.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { IBudgetRepository } from '../interfaces/repositories/IBudgetRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import { AppError } from '../utils/errors.js';
import { BudgetService } from './budgetService.js';

const userId = 1;

const outflowCategory: ICategory = {
  id: 3,
  name: 'Food',
  flowType: FlowType.OUTFLOW,
  order: 1,
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const inflowCategory: ICategory = {
  ...outflowCategory,
  id: 4,
  name: 'Salary',
  flowType: FlowType.INFLOW,
};

const createInput: IBudgetCreateInput = {
  categoryId: 3,
  amount: 500,
  date: new Date('2024-06-15T12:00:00.000Z'),
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

describe('BudgetService', () => {
  let budgetRepository: IBudgetRepository;
  let categoryRepository: ICategoryRepository;
  let transactionRepository: ITransactionRepository;
  let budgetService: BudgetService;

  beforeEach(() => {
    vi.clearAllMocks();

    budgetRepository = {
      findByIdAndUserId: vi.fn(),
      findByCategoryIdAndUserIdInMonth: vi.fn(),
      findAllByUserIdInMonth: vi.fn(),
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

    transactionRepository = {
      findRecentByUserId: vi.fn(),
      findRecentInDateRangeByUserId: vi.fn(),
      findOutflowAmountsInDateRangeByUserId: vi.fn(),
      sumOutflowByCategoryInDateRangeByUserId: vi.fn(),
      sumOutflowAmountByCategoryIdInDateRangeByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    budgetService = new BudgetService(budgetRepository, categoryRepository, transactionRepository);
  });

  describe('create', () => {
    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(budgetService.create(userId, createInput)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('throws when category is not outflow', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(inflowCategory);

      await expect(budgetService.create(userId, { ...createInput, categoryId: 4 })).rejects.toEqual(
        new AppError(400, 'Only outflow categories can have budgets'),
      );
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('throws when a budget already exists for the category in the month', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(outflowCategory);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(budget);

      await expect(budgetService.create(userId, createInput)).rejects.toEqual(
        new AppError(409, 'Budget already exists for this category in this month'),
      );
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('creates a budget for an outflow category in the given month', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(outflowCategory);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(null);
      vi.mocked(budgetRepository.create).mockResolvedValue(budget);

      const result: IBudget = await budgetService.create(userId, createInput);

      expect(budgetRepository.findByCategoryIdAndUserIdInMonth).toHaveBeenCalledWith(
        userId,
        createInput.categoryId,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(budgetRepository.create).toHaveBeenCalledWith(
        userId,
        { categoryId: createInput.categoryId, amount: createInput.amount },
        new Date('2024-06-01T00:00:00.000Z'),
      );
      expect(result).toEqual(budget);
    });
  });

  describe('getCurrentMonthOverview', () => {
    const transportCategory = {
      id: 5,
      name: 'Transport',
      flowType: FlowType.OUTFLOW,
      order: 2,
    };

    const transportBudget: IBudget = {
      id: 2,
      amount: 200,
      date: new Date('2024-06-01T00:00:00.000Z'),
      categoryId: 5,
      userId,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    };

    it('returns current month budgets with per-category spending and totals', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([
        {
          budget,
          category: {
            id: outflowCategory.id,
            name: outflowCategory.name,
            flowType: outflowCategory.flowType,
            order: outflowCategory.order,
          },
        },
        {
          budget: transportBudget,
          category: transportCategory,
        },
      ]);
      vi.mocked(transactionRepository.sumOutflowByCategoryInDateRangeByUserId).mockResolvedValue([
        { categoryId: 3, total: 320 },
        { categoryId: 5, total: 50 },
      ]);

      const result: ICurrentMonthBudgetOverview = await budgetService.getCurrentMonthOverview(userId);

      expect(budgetRepository.findAllByUserIdInMonth).toHaveBeenCalledWith(
        userId,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(transactionRepository.sumOutflowByCategoryInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(result).toEqual({
        month: '2024-06',
        summary: {
          totalBudget: 700,
          totalSpent: 370,
          remaining: 330,
        },
        budgets: [
          {
            budget,
            category: {
              id: outflowCategory.id,
              name: outflowCategory.name,
              flowType: outflowCategory.flowType,
              order: outflowCategory.order,
            },
            spent: 320,
            remaining: 180,
          },
          {
            budget: transportBudget,
            category: transportCategory,
            spent: 50,
            remaining: 150,
          },
        ],
      });
      vi.useRealTimers();
    });
  });

  describe('update', () => {
    const updateInput: IBudgetUpdateInput = { amount: 750 };

    it('throws when budget is not found', async () => {
      vi.mocked(budgetRepository.update).mockResolvedValue(null);

      await expect(budgetService.update(userId, budget.id, updateInput)).rejects.toEqual(
        new AppError(404, 'Budget not found'),
      );
    });

    it('updates the budget amount', async () => {
      const updated: IBudget = { ...budget, amount: 750 };
      vi.mocked(budgetRepository.update).mockResolvedValue(updated);

      const result: IBudget = await budgetService.update(userId, budget.id, updateInput);

      expect(budgetRepository.update).toHaveBeenCalledWith(budget.id, userId, 750);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('throws when budget is not found', async () => {
      vi.mocked(budgetRepository.delete).mockResolvedValue(null);

      await expect(budgetService.delete(userId, budget.id)).rejects.toEqual(
        new AppError(404, 'Budget not found'),
      );
    });

    it('deletes the budget when it exists', async () => {
      vi.mocked(budgetRepository.delete).mockResolvedValue(budget);

      await expect(budgetService.delete(userId, budget.id)).resolves.toBeUndefined();
      expect(budgetRepository.delete).toHaveBeenCalledWith(budget.id, userId);
    });
  });
});
