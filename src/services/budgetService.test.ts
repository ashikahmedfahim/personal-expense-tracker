import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowType } from '../generated/prisma/enums.js';
import type { ICategory } from '../interfaces/Category.js';
import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput, ICurrentMonthBudgetOverview, IOverallBudgetView } from '../interfaces/Budget.js';
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
      sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId: vi.fn(),
      sumOutflowAmountByCategoryIdInDateRangeByUserId: vi.fn(),
      sumCompletedAmountByCategoryIdAndFlowTypeInDateRangeByUserId: vi.fn(),
      sumCompletedAmountByFlowTypeInDateRangeByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    budgetService = new BudgetService(budgetRepository, categoryRepository, transactionRepository);
    vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).mockResolvedValue(0);
  });

  describe('create', () => {
    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(budgetService.create(userId, createInput)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('throws when creating a budget for an inflow category', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(inflowCategory);

      await expect(
        budgetService.create(userId, { ...createInput, categoryId: 4, amount: 100 }),
      ).rejects.toEqual(new AppError(400, 'Income is tracked via transactions, not budgets'));
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
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).mockResolvedValue(1000);
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

    it('throws when creating an outflow budget would make net balance negative', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(outflowCategory);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(null);
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).mockResolvedValue(100);

      await expect(budgetService.create(userId, createInput)).rejects.toEqual(
        new AppError(400, 'Budget allocation would result in a negative net balance'),
      );
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('throws when creating a savings budget would make net balance negative', async () => {
      const savingsCategory: ICategory = {
        ...outflowCategory,
        id: 8,
        name: 'Emergency Fund',
        flowType: FlowType.SAVINGS,
      };
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(savingsCategory);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(null);
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([
        {
          budget: { ...budget, id: 1, amount: 80, categoryId: 3 },
          category: {
            id: outflowCategory.id,
            name: outflowCategory.name,
            flowType: FlowType.OUTFLOW,
            order: 1,
          },
        },
      ]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).mockResolvedValue(100);

      await expect(
        budgetService.create(userId, { ...createInput, categoryId: 8, amount: 30 }),
      ).rejects.toEqual(new AppError(400, 'Budget allocation would result in a negative net balance'));
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('allows a savings budget when actual income covers outflow and savings allocations', async () => {
      const savingsCategory: ICategory = {
        ...outflowCategory,
        id: 8,
        name: 'Saving',
        flowType: FlowType.SAVINGS,
      };
      const savingsBudget: IBudget = {
        ...budget,
        id: 11,
        amount: 5000,
        categoryId: 8,
      };
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(savingsCategory);
      vi.mocked(budgetRepository.findByCategoryIdAndUserIdInMonth).mockResolvedValue(null);
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([
        {
          budget: { ...budget, id: 1, amount: 12000, categoryId: 3 },
          category: {
            id: outflowCategory.id,
            name: outflowCategory.name,
            flowType: FlowType.OUTFLOW,
            order: 1,
          },
        },
      ]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).mockResolvedValue(17000);
      vi.mocked(budgetRepository.create).mockResolvedValue(savingsBudget);

      const result: IBudget = await budgetService.create(userId, {
        ...createInput,
        categoryId: 8,
        amount: 5000,
      });

      expect(result).toEqual(savingsBudget);
      expect(budgetRepository.create).toHaveBeenCalled();
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

    it('returns current month budgets with live transaction totals and per-category spending', async () => {
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
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId)
        .mockImplementation(async (_userId, flowType) =>
          flowType === FlowType.OUTFLOW
            ? [
                { categoryId: 3, total: 320 },
                { categoryId: 5, total: 50 },
              ]
            : [],
        );
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId)
        .mockImplementation(async (_userId, flowType) => {
          if (flowType === FlowType.INFLOW) return 15000;
          if (flowType === FlowType.OUTFLOW) return 370;
          return 0;
        });

      const result: ICurrentMonthBudgetOverview = await budgetService.getCurrentMonthOverview(userId);

      expect(budgetRepository.findAllByUserIdInMonth).toHaveBeenCalledWith(
        userId,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(transactionRepository.sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        FlowType.OUTFLOW,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(transactionRepository.sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        FlowType.SAVINGS,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(result).toEqual({
        month: '2024-06',
        summary: {
          totalIncome: 15000,
          totalExpenses: 700,
          totalSavings: 0,
          netBalance: 14630,
          totalBudget: 700,
          totalSpent: 370,
          remaining: 14300,
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
            earned: 0,
            remaining: 180,
          },
          {
            budget: transportBudget,
            category: transportCategory,
            spent: 50,
            earned: 0,
            remaining: 150,
          },
        ],
      });
      vi.useRealTimers();
    });
  });

  describe('getCurrentMonthOverall', () => {
    it('returns actual transaction totals and planned budget allocations', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([
        {
          budget: { ...budget, id: 10, amount: 100, categoryId: 4 },
          category: {
            id: 4,
            name: 'Salary',
            flowType: FlowType.INFLOW,
            order: 0,
          },
        },
        {
          budget: { ...budget, id: 1, amount: 20, categoryId: 3 },
          category: {
            id: outflowCategory.id,
            name: 'Grocery',
            flowType: outflowCategory.flowType,
            order: 1,
          },
        },
        {
          budget: { ...budget, id: 2, amount: 70, categoryId: 5 },
          category: {
            id: 5,
            name: 'Rent',
            flowType: FlowType.OUTFLOW,
            order: 2,
          },
        },
        {
          budget: { ...budget, id: 3, amount: 5, categoryId: 6 },
          category: {
            id: 6,
            name: 'Bus',
            flowType: FlowType.OUTFLOW,
            order: 3,
          },
        },
        {
          budget: { ...budget, id: 4, amount: 5, categoryId: 7 },
          category: {
            id: 7,
            name: 'Saving',
            flowType: FlowType.SAVINGS,
            order: 4,
          },
        },
      ]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId)
        .mockImplementation(async (_userId, flowType) => {
          if (flowType === FlowType.INFLOW) return 15000;
          if (flowType === FlowType.OUTFLOW) return 14000;
          return 529;
        });

      const result: IOverallBudgetView = await budgetService.getCurrentMonthOverall(userId);

      expect(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        FlowType.INFLOW,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        FlowType.OUTFLOW,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).toHaveBeenCalledWith(
        userId,
        FlowType.SAVINGS,
        new Date('2024-06-01T00:00:00.000Z'),
        new Date('2024-06-30T23:59:59.999Z'),
      );
      expect(result).toEqual({
        month: '2024-06',
        totalIncome: 15000,
        totalExpenses: 14000,
        totalSavings: 529,
        totalAllocated: 14000,
        netBalance: 471,
        plannedIncome: 15000,
        plannedAllocated: 95,
        plannedSavings: 5,
        plannedNetBalance: 14900,
        income: [
          {
            category: {
              id: 4,
              name: 'Salary',
              flowType: FlowType.INFLOW,
              order: 0,
            },
            amount: 100,
          },
        ],
        allocations: [
          {
            category: {
              id: outflowCategory.id,
              name: 'Grocery',
              flowType: FlowType.OUTFLOW,
              order: 1,
            },
            amount: 20,
          },
          {
            category: {
              id: 5,
              name: 'Rent',
              flowType: FlowType.OUTFLOW,
              order: 2,
            },
            amount: 70,
          },
          {
            category: {
              id: 6,
              name: 'Bus',
              flowType: FlowType.OUTFLOW,
              order: 3,
            },
            amount: 5,
          },
        ],
        savings: [
          {
            category: {
              id: 7,
              name: 'Saving',
              flowType: FlowType.SAVINGS,
              order: 4,
            },
            amount: 5,
          },
        ],
      });
      vi.useRealTimers();
    });

    it('calculates planned net balance as income minus outflow and savings budgets', async () => {
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([
        {
          budget: { ...budget, id: 10, amount: 100, categoryId: 4 },
          category: {
            id: 4,
            name: 'Salary',
            flowType: FlowType.INFLOW,
            order: 0,
          },
        },
        {
          budget: { ...budget, id: 1, amount: 20, categoryId: 3 },
          category: {
            id: outflowCategory.id,
            name: 'Grocery',
            flowType: outflowCategory.flowType,
            order: 1,
          },
        },
        {
          budget: { ...budget, id: 2, amount: 70, categoryId: 5 },
          category: {
            id: 5,
            name: 'Rent',
            flowType: FlowType.OUTFLOW,
            order: 2,
          },
        },
        {
          budget: { ...budget, id: 3, amount: 5, categoryId: 6 },
          category: {
            id: 6,
            name: 'Bus',
            flowType: FlowType.OUTFLOW,
            order: 3,
          },
        },
      ]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId)
        .mockImplementation(async (_userId, flowType) => {
          if (flowType === FlowType.INFLOW) return 15000;
          if (flowType === FlowType.OUTFLOW) return 14529;
          return 0;
        });

      const result: IOverallBudgetView = await budgetService.getCurrentMonthOverall(userId);

      expect(result.totalIncome).toBe(15000);
      expect(result.totalExpenses).toBe(14529);
      expect(result.totalSavings).toBe(0);
      expect(result.totalAllocated).toBe(14529);
      expect(result.netBalance).toBe(471);
      expect(result.plannedIncome).toBe(15000);
      expect(result.plannedAllocated).toBe(95);
      expect(result.plannedSavings).toBe(0);
      expect(result.plannedNetBalance).toBe(14905);
    });
  });

  describe('update', () => {
    const updateInput: IBudgetUpdateInput = { amount: 750 };

    it('throws when budget is not found', async () => {
      vi.mocked(budgetRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(budgetService.update(userId, budget.id, updateInput)).rejects.toEqual(
        new AppError(404, 'Budget not found'),
      );
      expect(budgetRepository.update).not.toHaveBeenCalled();
    });

    it('throws when updating would make net balance negative', async () => {
      vi.mocked(budgetRepository.findByIdAndUserId).mockResolvedValue(budget);
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(outflowCategory);
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([
        {
          budget,
          category: {
            id: outflowCategory.id,
            name: outflowCategory.name,
            flowType: FlowType.OUTFLOW,
            order: 1,
          },
        },
      ]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).mockResolvedValue(100);

      await expect(budgetService.update(userId, budget.id, updateInput)).rejects.toEqual(
        new AppError(400, 'Budget allocation would result in a negative net balance'),
      );
      expect(budgetRepository.update).not.toHaveBeenCalled();
    });

    it('updates the budget amount', async () => {
      const updated: IBudget = { ...budget, amount: 750 };
      vi.mocked(budgetRepository.findByIdAndUserId).mockResolvedValue(budget);
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(outflowCategory);
      vi.mocked(budgetRepository.findAllByUserIdInMonth).mockResolvedValue([
        {
          budget,
          category: {
            id: outflowCategory.id,
            name: outflowCategory.name,
            flowType: FlowType.OUTFLOW,
            order: 1,
          },
        },
      ]);
      vi.mocked(transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId).mockResolvedValue(2000);
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
