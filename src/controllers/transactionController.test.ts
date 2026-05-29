import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { TransactionStatus } from '../generated/prisma/enums.js';
import type { IRequestUser } from '../interfaces/auth.js';
import type {
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
} from '../interfaces/Transaction.js';
import type { ITransactionService } from '../interfaces/services/ITransactionService.js';
import type { ITransactionValidator } from '../interfaces/validators/ITransactionValidator.js';
import { TransactionController } from './transactionController.js';

const authenticatedUser: IRequestUser = {
  id: 1,
  email: 'jane@example.com',
};

const transaction: ITransaction = {
  id: 20,
  title: 'Coffee',
  amount: 4.5,
  description: null,
  date: new Date('2024-06-01T10:00:00.000Z'),
  status: TransactionStatus.COMPLETED,
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

describe('TransactionController', () => {
  let transactionService: ITransactionService;
  let transactionValidator: ITransactionValidator;
  let transactionController: TransactionController;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    transactionService = {
      create: vi.fn(),
      update: vi.fn(),
    };

    transactionValidator = {
      validateCreateTransaction: vi.fn(),
      validateUpdateTransaction: vi.fn(),
      validateTransactionId: vi.fn(),
    };

    transactionController = new TransactionController(transactionService, transactionValidator);
    res = createMockResponse();
    next = vi.fn();
  });

  it('creates a transaction with a success message', async () => {
    const input: ITransactionCreateInput = {
      title: 'Coffee',
      amount: 4.5,
      categoryId: 3,
    };
    vi.mocked(transactionValidator.validateCreateTransaction).mockReturnValue(input);
    vi.mocked(transactionService.create).mockResolvedValue(transaction);
    const req: Request = createRequest({ body: input });

    await transactionController.createTransaction(req, res, next);

    expect(transactionService.create).toHaveBeenCalledWith(authenticatedUser.id, input);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Transaction created successfully',
      data: transaction,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('updates a transaction with a success message', async () => {
    const input: ITransactionUpdateInput = { title: 'Lunch', amount: 12 };
    vi.mocked(transactionValidator.validateTransactionId).mockReturnValue(transaction.id);
    vi.mocked(transactionValidator.validateUpdateTransaction).mockReturnValue(input);
    vi.mocked(transactionService.update).mockResolvedValue({ ...transaction, title: 'Lunch', amount: 12 });
    const req: Request = createRequest({ body: input, params: { id: '20' } });

    await transactionController.updateTransaction(req, res, next);

    expect(transactionService.update).toHaveBeenCalledWith(authenticatedUser.id, transaction.id, input);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Transaction updated successfully',
      data: { ...transaction, title: 'Lunch', amount: 12 },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
