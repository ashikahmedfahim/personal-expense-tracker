import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { FlowType } from '../generated/prisma/enums.js';
import type { IRequestUser } from '../interfaces/auth.js';
import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput, ICurrentMonthBudgetOverview, IOverallBudgetView } from '../interfaces/Budget.js';
import type { IBudgetService } from '../interfaces/services/IBudgetService.js';
import type { IBudgetValidator } from '../interfaces/validators/IBudgetValidator.js';
import { BudgetController } from './budgetController.js';

const authenticatedUser: IRequestUser = {
  id: 1,
  email: 'jane@example.com',
};

const budget: IBudget = {
  id: 1,
  amount: 500,
  date: new Date('2024-06-01T00:00:00.000Z'),
  categoryId: 3,
  userId: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function createMockResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    end: vi.fn(),
  } as unknown as Response;
}

function createRequest(overrides: Partial<Request> = {}): Request {
  return {
    user: authenticatedUser,
    body: {},
    params: {},
    ...overrides,
  } as Request;
}

describe('BudgetController', () => {
  let budgetService: IBudgetService;
  let budgetValidator: IBudgetValidator;
  let budgetController: BudgetController;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    budgetService = {
      create: vi.fn(),
      getCurrentMonthOverview: vi.fn(),
      getCurrentMonthOverall: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    budgetValidator = {
      validateCreateBudget: vi.fn(),
      validateUpdateBudget: vi.fn(),
      validateBudgetId: vi.fn(),
    };

    budgetController = new BudgetController(budgetService, budgetValidator);
    res = createMockResponse();
    next = vi.fn();
  });

  it('creates a budget with a success message', async () => {
    const input: IBudgetCreateInput = { categoryId: 3, amount: 500 };
    vi.mocked(budgetValidator.validateCreateBudget).mockReturnValue(input);
    vi.mocked(budgetService.create).mockResolvedValue(budget);
    const req: Request = createRequest({ body: input });

    await budgetController.createBudget(req, res, next);

    expect(budgetService.create).toHaveBeenCalledWith(authenticatedUser.id, input);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Budget created successfully',
      data: budget,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns current month budget overview', async () => {
    const overview: ICurrentMonthBudgetOverview = {
      month: '2024-06',
      summary: {
        totalBudget: 500,
        totalSpent: 320,
        remaining: 180,
      },
      budgets: [
        {
          budget,
          category: {
            id: 3,
            name: 'Food',
            flowType: FlowType.OUTFLOW,
            order: 1,
          },
          spent: 320,
          remaining: 180,
        },
      ],
    };
    vi.mocked(budgetService.getCurrentMonthOverview).mockResolvedValue(overview);
    const req: Request = createRequest();

    await budgetController.getCurrentMonthOverview(req, res, next);

    expect(budgetService.getCurrentMonthOverview).toHaveBeenCalledWith(authenticatedUser.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: null, data: overview });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns current month overall budget allocation', async () => {
    const overall: IOverallBudgetView = {
      month: '2024-06',
      totalIncome: 15000,
      totalExpenses: 14000,
      totalSavings: 529,
      totalAllocated: 14000,
      netBalance: 471,
      plannedIncome: 100,
      plannedAllocated: 95,
      plannedSavings: 5,
      plannedNetBalance: 0,
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
            id: 3,
            name: 'Grocery',
            flowType: FlowType.OUTFLOW,
            order: 1,
          },
          amount: 20,
        },
      ],
      savings: [],
    };
    vi.mocked(budgetService.getCurrentMonthOverall).mockResolvedValue(overall);
    const req: Request = createRequest();

    await budgetController.getCurrentMonthOverall(req, res, next);

    expect(budgetService.getCurrentMonthOverall).toHaveBeenCalledWith(authenticatedUser.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: null, data: overall });
    expect(next).not.toHaveBeenCalled();
  });

  it('updates a budget with a success message', async () => {
    const input: IBudgetUpdateInput = { amount: 750 };
    vi.mocked(budgetValidator.validateBudgetId).mockReturnValue(budget.id);
    vi.mocked(budgetValidator.validateUpdateBudget).mockReturnValue(input);
    vi.mocked(budgetService.update).mockResolvedValue({ ...budget, amount: 750 });
    const req: Request = createRequest({ body: input, params: { id: '1' } });

    await budgetController.updateBudget(req, res, next);

    expect(budgetService.update).toHaveBeenCalledWith(authenticatedUser.id, budget.id, input);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Budget updated successfully',
      data: { ...budget, amount: 750 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('deletes a budget with a success message', async () => {
    vi.mocked(budgetValidator.validateBudgetId).mockReturnValue(budget.id);
    vi.mocked(budgetService.delete).mockResolvedValue(undefined);
    const req: Request = createRequest({ params: { id: '1' } });

    await budgetController.deleteBudget(req, res, next);

    expect(budgetService.delete).toHaveBeenCalledWith(authenticatedUser.id, budget.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Budget deleted successfully',
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
