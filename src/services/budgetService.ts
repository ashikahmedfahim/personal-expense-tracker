import { FlowType } from '../generated/prisma/enums.js';
import type {
  IBudget,
  IBudgetCreateInput,
  IBudgetUpdateInput,
  ICurrentMonthBudgetOverview,
  IOverallBudgetAllocation,
  IOverallBudgetView,
} from '../interfaces/Budget.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { IBudgetRepository } from '../interfaces/repositories/IBudgetRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import type { IBudgetService } from '../interfaces/services/IBudgetService.js';
import { formatUtcMonthKey, getCurrentMonthUtcRange, getMonthUtcRange, normalizeToMonthStartUtc } from '../utils/date.js';
import { AppError } from '../utils/errors.js';

export class BudgetService implements IBudgetService {
  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async create(userId: number, data: IBudgetCreateInput): Promise<IBudget> {
    const category = await this.categoryRepository.findByIdAndUserId(data.categoryId, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    if (category.flowType === FlowType.INFLOW) {
      throw new AppError(400, 'Income is tracked via transactions, not budgets');
    }

    const referenceDate: Date = data.date ?? new Date();
    const monthStart: Date = normalizeToMonthStartUtc(referenceDate);
    const { start, end }: { start: Date; end: Date } = getMonthUtcRange(referenceDate);

    const existing: IBudget | null = await this.budgetRepository.findByCategoryIdAndUserIdInMonth(
      userId,
      data.categoryId,
      start,
      end,
    );
    if (existing) {
      throw new AppError(409, 'Budget already exists for this category in this month');
    }

    await this.ensureNonNegativeNetBalance(userId, start, end, category.flowType, data.amount);

    const budget: IBudget = await this.budgetRepository.create(
      userId,
      { categoryId: data.categoryId, amount: data.amount },
      monthStart,
    );
    return budget;
  }

  async getCurrentMonthOverview(userId: number): Promise<ICurrentMonthBudgetOverview> {
    const referenceDate: Date = new Date();
    const { start, end }: { start: Date; end: Date } = getCurrentMonthUtcRange(referenceDate);
    const [
      budgetsWithCategories,
      outflowSpending,
      savingsSpending,
      totalIncome,
      spentOutflow,
      spentSavings,
    ] = await Promise.all([
      this.budgetRepository.findAllByUserIdInMonth(userId, start, end),
      this.transactionRepository.sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId(
        userId,
        FlowType.OUTFLOW,
        start,
        end,
      ),
      this.transactionRepository.sumCompletedAmountByFlowTypeGroupedByCategoryInDateRangeByUserId(
        userId,
        FlowType.SAVINGS,
        start,
        end,
      ),
      this.transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId(
        userId,
        FlowType.INFLOW,
        start,
        end,
      ),
      this.transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId(
        userId,
        FlowType.OUTFLOW,
        start,
        end,
      ),
      this.transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId(
        userId,
        FlowType.SAVINGS,
        start,
        end,
      ),
    ]);

    const spentByCategoryId = new Map<number, number>([
      ...outflowSpending.map((item) => [item.categoryId, item.total] as const),
      ...savingsSpending.map((item) => [item.categoryId, item.total] as const),
    ]);

    let allocatedOutflow = 0;
    let allocatedSavings = 0;
    let totalSpent = 0;

    const budgets = budgetsWithCategories
      .filter(({ category }) => category.flowType !== FlowType.INFLOW)
      .map(({ budget, category }) => {
        const spent: number = spentByCategoryId.get(budget.categoryId) ?? 0;
        totalSpent += spent;

        if (category.flowType === FlowType.SAVINGS) {
          allocatedSavings += budget.amount;
        } else {
          allocatedOutflow += budget.amount;
        }

        return {
          budget,
          category,
          spent,
          earned: 0,
          remaining: budget.amount - spent,
        };
      });

    const netBalance: number = totalIncome - spentOutflow - spentSavings;
    const remaining: number = totalIncome - allocatedOutflow - allocatedSavings;

    return {
      month: formatUtcMonthKey(referenceDate),
      summary: {
        totalIncome,
        totalExpenses: allocatedOutflow,
        totalSavings: allocatedSavings,
        netBalance,
        totalBudget: allocatedOutflow + allocatedSavings,
        totalSpent,
        remaining,
      },
      budgets,
    };
  }

  async getCurrentMonthOverall(userId: number): Promise<IOverallBudgetView> {
    const referenceDate: Date = new Date();
    const { start, end }: { start: Date; end: Date } = getCurrentMonthUtcRange(referenceDate);
    const [budgetsWithCategories, actualIncome, actualExpenses, actualSavings] = await Promise.all([
      this.budgetRepository.findAllByUserIdInMonth(userId, start, end),
      this.transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId(
        userId,
        FlowType.INFLOW,
        start,
        end,
      ),
      this.transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId(
        userId,
        FlowType.OUTFLOW,
        start,
        end,
      ),
      this.transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId(
        userId,
        FlowType.SAVINGS,
        start,
        end,
      ),
    ]);

    const income: IOverallBudgetAllocation[] = [];
    const allocations: IOverallBudgetAllocation[] = [];
    const savings: IOverallBudgetAllocation[] = [];

    for (const { budget, category } of budgetsWithCategories) {
      const item: IOverallBudgetAllocation = {
        category,
        amount: budget.amount,
      };

      if (category.flowType === FlowType.INFLOW) {
        income.push(item);
        continue;
      }

      if (category.flowType === FlowType.SAVINGS) {
        savings.push(item);
        continue;
      }

      allocations.push(item);
    }

    const plannedAllocated: number = allocations.reduce((sum, item) => sum + item.amount, 0);
    const plannedSavings: number = savings.reduce((sum, item) => sum + item.amount, 0);

    return {
      month: formatUtcMonthKey(referenceDate),
      totalIncome: actualIncome,
      totalExpenses: actualExpenses,
      totalSavings: actualSavings,
      totalAllocated: actualExpenses,
      netBalance: actualIncome - actualExpenses - actualSavings,
      plannedIncome: actualIncome,
      plannedAllocated,
      plannedSavings,
      plannedNetBalance: actualIncome - plannedAllocated - plannedSavings,
      income,
      allocations,
      savings,
    };
  }

  async update(userId: number, id: number, data: IBudgetUpdateInput): Promise<IBudget> {
    const existing: IBudget | null = await this.budgetRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new AppError(404, 'Budget not found');
    }

    const category = await this.categoryRepository.findByIdAndUserId(existing.categoryId, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    if (category.flowType === FlowType.INFLOW) {
      throw new AppError(400, 'Income is tracked via transactions, not budgets');
    }

    const { start, end }: { start: Date; end: Date } = getMonthUtcRange(existing.date);
    await this.ensureNonNegativeNetBalance(userId, start, end, category.flowType, data.amount, existing.id);

    const budget: IBudget | null = await this.budgetRepository.update(id, userId, data.amount);
    if (!budget) {
      throw new AppError(404, 'Budget not found');
    }
    return budget;
  }

  async delete(userId: number, id: number): Promise<void> {
    const budget: IBudget | null = await this.budgetRepository.delete(id, userId);
    if (!budget) {
      throw new AppError(404, 'Budget not found');
    }
  }

  private async ensureNonNegativeNetBalance(
    userId: number,
    start: Date,
    end: Date,
    flowType: FlowType,
    amount: number,
    excludeBudgetId?: number,
  ): Promise<void> {
    const [budgetsWithCategories, actualIncome] = await Promise.all([
      this.budgetRepository.findAllByUserIdInMonth(userId, start, end),
      this.transactionRepository.sumCompletedAmountByFlowTypeInDateRangeByUserId(
        userId,
        FlowType.INFLOW,
        start,
        end,
      ),
    ]);
    const netBalance: number = this.calculateNetBalance(
      budgetsWithCategories,
      flowType,
      amount,
      actualIncome,
      excludeBudgetId,
    );

    if (netBalance < 0) {
      throw new AppError(400, 'Budget allocation would result in a negative net balance');
    }
  }

  private calculateNetBalance(
    budgetsWithCategories: Array<{ budget: IBudget; category: { flowType: FlowType } }>,
    flowType: FlowType,
    amount: number,
    actualIncome: number,
    excludeBudgetId?: number,
  ): number {
    let totalOutflow = 0;
    let totalSavings = 0;

    for (const { budget, category } of budgetsWithCategories) {
      if (excludeBudgetId !== undefined && budget.id === excludeBudgetId) {
        continue;
      }

      if (category.flowType === FlowType.SAVINGS) {
        totalSavings += budget.amount;
      } else if (category.flowType === FlowType.OUTFLOW) {
        totalOutflow += budget.amount;
      }
    }

    if (flowType === FlowType.SAVINGS) {
      totalSavings += amount;
    } else if (flowType === FlowType.OUTFLOW) {
      totalOutflow += amount;
    }

    return actualIncome - totalOutflow - totalSavings;
  }
}
