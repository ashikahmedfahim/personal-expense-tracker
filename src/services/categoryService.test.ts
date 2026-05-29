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
      create: vi.fn(),
      update: vi.fn(),
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
    it('creates a category for the user', async () => {
      vi.mocked(categoryRepository.create).mockResolvedValue(category);

      const result: ICategory = await categoryService.create(userId, createInput);

      expect(categoryRepository.create).toHaveBeenCalledWith(userId, createInput);
      expect(result).toEqual(category);
    });
  });

  describe('update', () => {
    it('updates category order', async () => {
      const updated: ICategory = { ...category, order: 2 };
      vi.mocked(categoryRepository.update).mockResolvedValue(updated);

      const result: ICategory = await categoryService.update(userId, category.id, { order: 2 });

      expect(categoryRepository.update).toHaveBeenCalledWith(category.id, userId, { order: 2 });
      expect(result).toEqual(updated);
    });

    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.update).mockResolvedValue(null);

      await expect(categoryService.update(userId, category.id, updateInput)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
    });

    it('returns the updated category', async () => {
      const updated: ICategory = { ...category, name: 'Food' };
      vi.mocked(categoryRepository.update).mockResolvedValue(updated);

      const result: ICategory = await categoryService.update(userId, category.id, updateInput);

      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.delete).mockResolvedValue(null);

      await expect(categoryService.delete(userId, category.id)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
    });

    it('deletes the category when it exists', async () => {
      vi.mocked(categoryRepository.delete).mockResolvedValue(category);

      await expect(categoryService.delete(userId, category.id)).resolves.toBeUndefined();
    });
  });
});
