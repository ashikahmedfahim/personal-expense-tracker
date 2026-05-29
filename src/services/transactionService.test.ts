import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowType, TransactionStatus } from '../generated/prisma/enums.js';
import type { ICategory } from '../interfaces/Category.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository.js';
import type {
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
} from '../interfaces/Transaction.js';
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

const updateInput: ITransactionUpdateInput = {
  title: 'Lunch',
  amount: 12,
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
      findRecentByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

  describe('listRecent', () => {
    it('returns the last 10 transactions for the user', async () => {
      vi.mocked(transactionRepository.findRecentByUserId).mockResolvedValue([transaction]);

      const result: ITransaction[] = await transactionService.listRecent(userId);

      expect(transactionRepository.findRecentByUserId).toHaveBeenCalledWith(userId, 10);
      expect(result).toEqual([transaction]);
    });
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

  describe('update', () => {
    it('throws when transaction is not found', async () => {
      vi.mocked(transactionRepository.update).mockResolvedValue(null);

      await expect(transactionService.update(userId, transaction.id, updateInput)).rejects.toEqual(
        new AppError(404, 'Transaction not found'),
      );
    });

    it('throws when category is not found', async () => {
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        transactionService.update(userId, transaction.id, { categoryId: 99 }),
      ).rejects.toEqual(new AppError(404, 'Category not found'));
      expect(transactionRepository.update).not.toHaveBeenCalled();
    });

    it('updates a transaction when it exists', async () => {
      const updated: ITransaction = { ...transaction, title: 'Lunch', amount: 12 };
      vi.mocked(transactionRepository.update).mockResolvedValue(updated);

      const result: ITransaction = await transactionService.update(userId, transaction.id, updateInput);

      expect(transactionRepository.update).toHaveBeenCalledWith(transaction.id, userId, updateInput);
      expect(result).toEqual(updated);
    });

    it('validates category when categoryId is provided', async () => {
      const updated: ITransaction = { ...transaction, categoryId: 5 };
      vi.mocked(categoryRepository.findByIdAndUserId).mockResolvedValue({
        ...category,
        id: 5,
      });
      vi.mocked(transactionRepository.update).mockResolvedValue(updated);

      const result: ITransaction = await transactionService.update(userId, transaction.id, { categoryId: 5 });

      expect(categoryRepository.findByIdAndUserId).toHaveBeenCalledWith(5, userId);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('throws when transaction is not found', async () => {
      vi.mocked(transactionRepository.delete).mockResolvedValue(null);

      await expect(transactionService.delete(userId, transaction.id)).rejects.toEqual(
        new AppError(404, 'Transaction not found'),
      );
    });

    it('deletes the transaction when it exists', async () => {
      vi.mocked(transactionRepository.delete).mockResolvedValue(transaction);

      await expect(transactionService.delete(userId, transaction.id)).resolves.toBeUndefined();
      expect(transactionRepository.delete).toHaveBeenCalledWith(transaction.id, userId);
    });
  });
});
