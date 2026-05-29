import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import type { IRequestUser } from '../interfaces/auth.js';
import type { IBudget, IBudgetCreateInput } from '../interfaces/Budget.js';
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
    };

    budgetValidator = {
      validateCreateBudget: vi.fn(),
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
});
