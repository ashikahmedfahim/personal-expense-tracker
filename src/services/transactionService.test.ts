import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowType, TransactionStatus } from '../generated/prisma/enums.js';
import type { ICategory } from '../interfaces/Category.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import type { ITransaction, ITransactionCreateInput } from '../interfaces/Transaction.js';
import { AppError } from '../utils/errors.js';
import { TransactionService } from './transactionService.js';

const userId = 1;

const category: ICategory = {
  id: 3,
  name: 'Food',
  flowType: FlowType.OUTFLOW,
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const createInput: ITransactionCreateInput = {
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
  userId,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('TransactionService', () => {
  let transactionRepository: ITransactionRepository;
  let categoryRepository: ICategoryRepository;
  let transactionService: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();

    transactionRepository = {
      create: vi.fn(),
    };

    categoryRepository = {
      findAllByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    transactionService = new TransactionService(transactionRepository, categoryRepository);
  });

  describe('create', () => {
    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(transactionService.create(userId, createInput)).rejects.toEqual(
        new AppError(404, 'Category not found'),
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('creates a transaction when category exists', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(category);
      vi.mocked(transactionRepository.create).mockResolvedValue(transaction);

      const result: ITransaction = await transactionService.create(userId, createInput);

      expect(categoryRepository.findByIdAndUserId).toHaveBeenCalledWith(createInput.categoryId, userId);
      expect(transactionRepository.create).toHaveBeenCalledWith(userId, createInput);
      expect(result).toEqual(transaction);
    });
  });
});
