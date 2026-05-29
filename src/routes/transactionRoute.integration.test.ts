import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { TransactionStatus } from '../generated/prisma/enums.js';
import type { ITransaction } from '../interfaces/Transaction.js';
import { JWT } from '../utils/JWT.js';

const mockCreate = vi.fn();

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
      create: mockCreate,
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
});
