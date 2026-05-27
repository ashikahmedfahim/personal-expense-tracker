import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { FlowType } from '../generated/prisma/enums.js';
import type { ICategory } from '../interfaces/Category.js';
import { JWT } from '../utils/JWT.js';

const mockList = vi.fn();
const mockGetById = vi.fn();
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

vi.mock('../services/categoryService.js', () => ({
  CategoryService: vi.fn(function CategoryService() {
    return {
      list: mockList,
      getById: mockGetById,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    };
  }),
}));

const { createApp } = await import('../app.js');

const authHeader = { Authorization: 'Bearer valid-token' };

const validCreateBody = {
  name: 'Groceries',
  flowType: FlowType.OUTFLOW,
};

const category: ICategory = {
  id: 10,
  name: 'Groceries',
  flowType: FlowType.OUTFLOW,
  userId: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const serializedCategory = {
  ...category,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
};

describe('Category routes (authenticated)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(JWT.verify).mockReturnValue({ id: 1, email: 'jane@example.com' });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const response = await request(app).get('/v1/categories');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Authentication required' });
    expect(mockList).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    vi.mocked(JWT.verify).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('jwt malformed');
    });

    const response = await request(app)
      .get('/v1/categories')
      .set(authHeader);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid or expired token' });
    expect(mockList).not.toHaveBeenCalled();
  });

  describe('GET /v1/categories', () => {
    it('returns 200 with the user categories', async () => {
      mockList.mockResolvedValue([category]);

      const response = await request(app)
        .get('/v1/categories')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: null,
        data: [serializedCategory],
      });
      expect(mockList).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /v1/categories/:id', () => {
    it('returns 200 with the category', async () => {
      mockGetById.mockResolvedValue(category);

      const response = await request(app)
        .get('/v1/categories/10')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: null,
        data: serializedCategory,
      });
      expect(mockGetById).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('POST /v1/categories', () => {
    it('returns 400 when the request body fails validation', async () => {
      const response = await request(app)
        .post('/v1/categories')
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns 201 when creation succeeds', async () => {
      mockCreate.mockResolvedValue(category);

      const response = await request(app)
        .post('/v1/categories')
        .set(authHeader)
        .send(validCreateBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Category created successfully',
        data: serializedCategory,
      });
      expect(mockCreate).toHaveBeenCalledWith(1, validCreateBody);
    });
  });

  describe('PATCH /v1/categories/:id', () => {
    it('returns 400 when the request body fails validation', async () => {
      const response = await request(app)
        .patch('/v1/categories/10')
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns 200 when update succeeds', async () => {
      const updated: ICategory = { ...category, name: 'Food' };
      mockUpdate.mockResolvedValue(updated);

      const response = await request(app)
        .patch('/v1/categories/10')
        .set(authHeader)
        .send({ name: 'Food' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Category updated successfully',
        data: {
          ...serializedCategory,
          name: 'Food',
        },
      });
      expect(mockUpdate).toHaveBeenCalledWith(1, 10, { name: 'Food' });
    });
  });

  describe('DELETE /v1/categories/:id', () => {
    it('returns 200 with a success message when deletion succeeds', async () => {
      mockDelete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/v1/categories/10')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Category deleted successfully',
        data: null,
      });
      expect(mockDelete).toHaveBeenCalledWith(1, 10);
    });
  });
});
