import { FlowType } from '../generated/prisma/enums.js';
import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput } from '../interfaces/Budget.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { IBudgetRepository } from '../interfaces/repositories/IBudgetRepository.js';
import type { IBudgetService } from '../interfaces/services/IBudgetService.js';
import { getMonthUtcRange, normalizeToMonthStartUtc } from '../utils/date.js';
import { AppError } from '../utils/errors.js';

export class BudgetService implements IBudgetService {
  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async create(userId: number, data: IBudgetCreateInput): Promise<IBudget> {
    const category = await this.categoryRepository.findByIdAndUserId(data.categoryId, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    if (category.flowType !== FlowType.OUTFLOW) {
      throw new AppError(400, 'Only outflow categories can have budgets');
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

    const budget: IBudget = await this.budgetRepository.create(
      userId,
      { categoryId: data.categoryId, amount: data.amount },
      monthStart,
    );
    return budget;
  }

  async update(userId: number, id: number, data: IBudgetUpdateInput): Promise<IBudget> {
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
}
