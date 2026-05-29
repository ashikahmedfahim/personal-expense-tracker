import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import type { IBudget } from '../interfaces/Budget.js';
import { JWT } from '../utils/JWT.js';

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

vi.mock('../services/budgetService.js', () => ({
  BudgetService: vi.fn(function BudgetService() {
    return {
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    };
  }),
}));

const { createApp } = await import('../app.js');

const authHeader = { Authorization: 'Bearer valid-token' };

const validCreateBody = {
  categoryId: 3,
  amount: 500,
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

const serializedBudget = {
  ...budget,
  date: budget.date.toISOString(),
  createdAt: budget.createdAt.toISOString(),
  updatedAt: budget.updatedAt.toISOString(),
};

describe('Budget routes (authenticated)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(JWT.verify).mockReturnValue({ id: 1, email: 'jane@example.com' });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await request(app).post('/v1/budgets').send(validCreateBody);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Authentication required' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  describe('POST /v1/budgets', () => {
    it('returns 400 when the request body fails validation', async () => {
      const response = await request(app)
        .post('/v1/budgets')
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns 201 when creation succeeds', async () => {
      mockCreate.mockResolvedValue(budget);

      const response = await request(app)
        .post('/v1/budgets')
        .set(authHeader)
        .send(validCreateBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Budget created successfully',
        data: serializedBudget,
      });
      expect(mockCreate).toHaveBeenCalledWith(1, validCreateBody);
    });
  });

  describe('PATCH /v1/budgets/:id', () => {
    it('returns 400 when the request body fails validation', async () => {
      const response = await request(app)
        .patch('/v1/budgets/1')
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns 200 when update succeeds', async () => {
      const updated: IBudget = { ...budget, amount: 750 };
      mockUpdate.mockResolvedValue(updated);

      const response = await request(app)
        .patch('/v1/budgets/1')
        .set(authHeader)
        .send({ amount: 750 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Budget updated successfully',
        data: {
          ...serializedBudget,
          amount: 750,
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith(1, 1, { amount: 750 });
    });
  });

  describe('DELETE /v1/budgets/:id', () => {
    it('returns 200 with a success message when deletion succeeds', async () => {
      mockDelete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/v1/budgets/1')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Budget deleted successfully',
        data: null,
      });
      expect(mockDelete).toHaveBeenCalledWith(1, 1);
    });
  });
});
