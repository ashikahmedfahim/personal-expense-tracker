import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { FlowType, TransactionStatus } from '../generated/prisma/enums.js';
import type { ITransaction, ITransactionsByCategory } from '../interfaces/Transaction.js';
import { JWT } from '../utils/JWT.js';

const mockListRecent = vi.fn();
const mockListCurrentMonth = vi.fn();
const mockGetCurrentMonthOverview = vi.fn();
const mockGetCurrentMonthDailyTotals = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../database/index.js', () => ({
  SQLDatabase: {
    getInstance: vi.fn(() => ({})),
  },
}));

vi.mock('../utils/JWT.js', () => ({
  JWT: {
    verify: vi.fn(),
  },
}));

vi.mock('../services/transactionService.js', () => ({
  TransactionService: vi.fn(function TransactionService() {
    return {
      listRecent: mockListRecent,
      listCurrentMonth: mockListCurrentMonth,
      getCurrentMonthOverview: mockGetCurrentMonthOverview,
      getCurrentMonthDailyTotals: mockGetCurrentMonthDailyTotals,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    };
  }),
}));

const { createApp } = await import('../app.js');

const authHeader = { Authorization: 'Bearer valid-token' };

const validCreateBody = {
  title: 'Coffee',
  amount: 4.5,
  categoryId: 3,
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

const serializedTransaction = {
  ...transaction,
  date: transaction.date.toISOString(),
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
};

const groupedCurrentMonth: ITransactionsByCategory[] = [
  {
    category: {
      id: 3,
      name: 'Food',
      flowType: FlowType.OUTFLOW,
      order: 1,
      transactions: [transaction],
    },
  },
];

const serializedGroupedCurrentMonth = [
  {
    category: {
      id: 3,
      name: 'Food',
      flowType: FlowType.OUTFLOW,
      order: 1,
      transactions: [serializedTransaction],
    },
  },
];

describe('Transaction routes (authenticated)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(JWT.verify).mockReturnValue({ id: 1, email: 'jane@example.com' });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await request(app).post('/v1/transactions').send(validCreateBody);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Authentication required' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    vi.mocked(JWT.verify).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('jwt malformed');
    });

    const response = await request(app)
      .post('/v1/transactions')
      .set(authHeader)
      .send(validCreateBody);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid or expired token' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  describe('GET /v1/transactions', () => {
    it('returns 200 with the user recent transactions', async () => {
      mockListRecent.mockResolvedValue([transaction]);

      const response = await request(app)
        .get('/v1/transactions')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: null,
        data: [serializedTransaction],
      });
      expect(mockListRecent).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /v1/transactions/current-month', () => {
    it('returns 200 with current month transactions grouped by category', async () => {
      mockListCurrentMonth.mockResolvedValue(groupedCurrentMonth);

      const response = await request(app)
        .get('/v1/transactions/current-month')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: null,
        data: serializedGroupedCurrentMonth,
      });
      expect(mockListCurrentMonth).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /v1/transactions/current-month/overview', () => {
    it('returns 200 with current month transaction totals', async () => {
      const overview = {
        month: '2024-06',
        summary: {
          totalIncome: 17000,
          totalExpenses: 12000,
          totalSavings: 0,
          netBalance: 5000,
        },
        categories: [],
      };
      mockGetCurrentMonthOverview.mockResolvedValue(overview);

      const response = await request(app)
        .get('/v1/transactions/current-month/overview')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: null,
        data: overview,
      });
      expect(mockGetCurrentMonthOverview).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /v1/transactions/current-month/daily-totals', () => {
    it('returns 200 with daily expense totals for the current UTC month', async () => {
      const dailyTotals = [
        { date: '2024-06-01', total: 14.5 },
        { date: '2024-06-02', total: 0 },
      ];
      mockGetCurrentMonthDailyTotals.mockResolvedValue(dailyTotals);

      const response = await request(app)
        .get('/v1/transactions/current-month/daily-totals')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: null,
        data: dailyTotals,
      });
      expect(mockGetCurrentMonthDailyTotals).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /v1/transactions', () => {
    it('returns 400 when the request body fails validation', async () => {
      const response = await request(app)
        .post('/v1/transactions')
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns 400 when amount is not positive', async () => {
      const negativeResponse = await request(app)
        .post('/v1/transactions')
        .set(authHeader)
        .send({ ...validCreateBody, amount: -1 });

      expect(negativeResponse.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();

      const zeroResponse = await request(app)
        .post('/v1/transactions')
        .set(authHeader)
        .send({ ...validCreateBody, amount: 0 });

      expect(zeroResponse.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns 201 when creation succeeds', async () => {
      mockCreate.mockResolvedValue(transaction);

      const response = await request(app)
        .post('/v1/transactions')
        .set(authHeader)
        .send(validCreateBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Transaction created successfully',
        data: serializedTransaction,
      });
      expect(mockCreate).toHaveBeenCalledWith(1, validCreateBody);
    });

    it('does not pass status from request body to the service', async () => {
      mockCreate.mockResolvedValue(transaction);

      await request(app)
        .post('/v1/transactions')
        .set(authHeader)
        .send({ ...validCreateBody, status: TransactionStatus.PENDING });

      expect(mockCreate).toHaveBeenCalledWith(1, validCreateBody);
    });
  });

  describe('PATCH /v1/transactions/:id', () => {
    it('returns 400 when the request body fails validation', async () => {
      const response = await request(app)
        .patch('/v1/transactions/20')
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns 400 when amount is not positive', async () => {
      const negativeResponse = await request(app)
        .patch('/v1/transactions/20')
        .set(authHeader)
        .send({ amount: -5 });

      expect(negativeResponse.status).toBe(400);
      expect(mockUpdate).not.toHaveBeenCalled();

      const zeroResponse = await request(app)
        .patch('/v1/transactions/20')
        .set(authHeader)
        .send({ amount: 0 });

      expect(zeroResponse.status).toBe(400);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns 200 when update succeeds', async () => {
      const updated: ITransaction = { ...transaction, title: 'Lunch', amount: 12 };
      mockUpdate.mockResolvedValue(updated);

      const response = await request(app)
        .patch('/v1/transactions/20')
        .set(authHeader)
        .send({ title: 'Lunch', amount: 12 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Transaction updated successfully',
        data: {
          ...serializedTransaction,
          title: 'Lunch',
          amount: 12,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith(1, 20, { title: 'Lunch', amount: 12 });
    });

  });

  describe('DELETE /v1/transactions/:id', () => {
    it('returns 200 with a success message when deletion succeeds', async () => {
      mockDelete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/v1/transactions/20')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Transaction deleted successfully',
        data: null,
      });
      expect(mockDelete).toHaveBeenCalledWith(1, 20);
    });
  });
});
