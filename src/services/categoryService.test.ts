import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowType } from '../generated/prisma/enums.js';
import type { ICategory, ICategoryCreateInput, ICategoryUpdateInput } from '../interfaces/Category.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import { AppError } from '../utils/errors.js';
import { CategoryService } from './categoryService.js';

const userId = 1;

const category: ICategory = {
  id: 10,
  name: 'Groceries',
  flowType: FlowType.OUTFLOW,
  order: 1,
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const secondCategory: ICategory = {
  id: 11,
  name: 'Transport',
  flowType: FlowType.OUTFLOW,
  order: 2,
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const createInput: ICategoryCreateInput = {
  name: 'Groceries',
  flowType: FlowType.OUTFLOW,
};

const updateInput: ICategoryUpdateInput = {
  name: 'Food',
};

describe('CategoryService', () => {
  let categoryRepository: ICategoryRepository;
  let categoryService: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();

    categoryRepository = {
      findAllByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      getLastOrderByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateOrders: vi.fn(),
      delete: vi.fn(),
    };

    categoryService = new CategoryService(categoryRepository);
  });

  describe('list', () => {
    it('returns categories for the user', async () => {
      vi.mocked(categoryRepository.findAllByUserId).mockResolvedValue([category]);

      const result: ICategory[] = await categoryService.list(userId);

      expect(categoryRepository.findAllByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([category]);
    });
  });

  describe('getById', () => {
    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(categoryService.getById(userId, category.id)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
    });

    it('returns the category when it exists', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(category);

      const result: ICategory = await categoryService.getById(userId, category.id);

      expect(result).toEqual(category);
    });
  });

  describe('create', () => {
    it('assigns the next order per user when creating', async () => {
      vi.mocked(categoryRepository.getLastOrderByUserId).mockResolvedValue(1);
      vi.mocked(categoryRepository.create).mockResolvedValue(secondCategory);

      const result: ICategory = await categoryService.create(userId, createInput);

      expect(categoryRepository.getLastOrderByUserId).toHaveBeenCalledWith(userId);
      expect(categoryRepository.create).toHaveBeenCalledWith(userId, createInput, 2);
      expect(result).toEqual(secondCategory);
    });

    it('starts at order 1 for the first category', async () => {
      vi.mocked(categoryRepository.getLastOrderByUserId).mockResolvedValue(0);
      vi.mocked(categoryRepository.create).mockResolvedValue(category);

      await categoryService.create(userId, createInput);

      expect(categoryRepository.create).toHaveBeenCalledWith(userId, createInput, 1);
    });
  });

  describe('update', () => {
    it('reorders categories when order is updated', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId)
        .mockResolvedValueOnce(secondCategory)
        .mockResolvedValueOnce({ ...secondCategory, order: 1 });
      vi.mocked(categoryRepository.findAllByUserId).mockResolvedValue([category, secondCategory]);

      const result: ICategory = await categoryService.update(userId, secondCategory.id, { order: 1 });

      expect(categoryRepository.updateOrders).toHaveBeenCalledWith([
        { id: secondCategory.id, order: 1 },
        { id: category.id, order: 2 },
      ]);
      expect(categoryRepository.update).not.toHaveBeenCalled();
      expect(result.order).toBe(1);
    });

    it('updates fields without reordering when order is omitted', async () => {
      const updated: ICategory = { ...category, name: 'Food' };
      vi.mocked(categoryRepository.findByIdAndUserId)
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(updated);
      vi.mocked(categoryRepository.update).mockResolvedValue(updated);

      const result: ICategory = await categoryService.update(userId, category.id, updateInput);

      expect(categoryRepository.update).toHaveBeenCalledWith(category.id, userId, updateInput);
      expect(categoryRepository.updateOrders).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(categoryService.update(userId, category.id, updateInput)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
    });
  });

  describe('delete', () => {
    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.delete).mockResolvedValue(null);

      await expect(categoryService.delete(userId, category.id)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
    });

    it('deletes the category and compacts remaining orders', async () => {
      vi.mocked(categoryRepository.delete).mockResolvedValue(category);
      vi.mocked(categoryRepository.findAllByUserId).mockResolvedValue([secondCategory]);

      await expect(categoryService.delete(userId, category.id)).resolves.toBeUndefined();

      expect(categoryRepository.delete).toHaveBeenCalledWith(category.id, userId);
      expect(categoryRepository.updateOrders).toHaveBeenCalledWith([{ id: secondCategory.id, order: 1 }]);
    });
  });
});
