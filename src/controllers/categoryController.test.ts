import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { FlowType } from '../generated/prisma/enums.js';
import type { IRequestUser } from '../interfaces/auth.js';
import type { ICategory, ICategoryCreateInput, ICategoryUpdateInput } from '../interfaces/Category.js';
import type { ICategoryService } from '../interfaces/services/ICategoryService.js';
import type { ICategoryValidator } from '../interfaces/validators/ICategoryValidator.js';
import { CategoryController } from './categoryController.js';

const authenticatedUser: IRequestUser = {
  id: 1,
  email: 'jane@example.com',
};

const category: ICategory = {
  id: 10,
  name: 'Groceries',
  flowType: FlowType.OUTFLOW,
  order: 1,
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

describe('CategoryController', () => {
  let categoryService: ICategoryService;
  let categoryValidator: ICategoryValidator;
  let categoryController: CategoryController;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    categoryService = {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    categoryValidator = {
      validateCreateCategory: vi.fn(),
      validateUpdateCategory: vi.fn(),
      validateCategoryId: vi.fn(),
    };

    categoryController = new CategoryController(categoryService, categoryValidator);
    res = createMockResponse();
    next = vi.fn();
  });

  it('lists categories for the authenticated user', async () => {
    vi.mocked(categoryService.list).mockResolvedValue([category]);
    const req: Request = createRequest();

    await categoryController.listCategories(req, res, next);

    expect(categoryService.list).toHaveBeenCalledWith(authenticatedUser.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: null, data: [category] });
    expect(next).not.toHaveBeenCalled();
  });

  it('creates a category with a success message', async () => {
    const input: ICategoryCreateInput = { name: 'Groceries', flowType: FlowType.OUTFLOW };
    vi.mocked(categoryValidator.validateCreateCategory).mockReturnValue(input);
    vi.mocked(categoryService.create).mockResolvedValue(category);
    const req: Request = createRequest({ body: input });

    await categoryController.createCategory(req, res, next);

    expect(categoryService.create).toHaveBeenCalledWith(authenticatedUser.id, input);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Category created successfully',
      data: category,
    });
  });

  it('updates a category with a success message', async () => {
    const input: ICategoryUpdateInput = { name: 'Food' };
    vi.mocked(categoryValidator.validateCategoryId).mockReturnValue(category.id);
    vi.mocked(categoryValidator.validateUpdateCategory).mockReturnValue(input);
    vi.mocked(categoryService.update).mockResolvedValue({ ...category, name: 'Food' });
    const req: Request = createRequest({ body: input, params: { id: '10' } });

    await categoryController.updateCategory(req, res, next);

    expect(categoryService.update).toHaveBeenCalledWith(authenticatedUser.id, category.id, input);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Category updated successfully',
      data: { ...category, name: 'Food' },
    });
  });

  it('deletes a category with a success message', async () => {
    vi.mocked(categoryValidator.validateCategoryId).mockReturnValue(category.id);
    vi.mocked(categoryService.delete).mockResolvedValue(undefined);
    const req: Request = createRequest({ params: { id: '10' } });

    await categoryController.deleteCategory(req, res, next);

    expect(categoryService.delete).toHaveBeenCalledWith(authenticatedUser.id, category.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Category deleted successfully',
      data: null,
    });
    expect(res.end).not.toHaveBeenCalled();
  });
});
