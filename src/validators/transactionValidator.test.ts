import { describe, expect, it } from 'vitest';
import { TransactionStatus } from '../generated/prisma/enums.js';
import { TransactionValidator } from './transactionValidator.js';

describe('TransactionValidator', () => {
  const transactionValidator = new TransactionValidator();

  it('validates create transaction input', () => {
    const result = transactionValidator.validateCreateTransaction({
      title: 'Coffee',
      amount: 4.5,
      categoryId: 3,
      description: 'Morning coffee',
      date: '2024-06-01T10:00:00.000Z',
    });

    expect(result).toEqual({
      title: 'Coffee',
      amount: 4.5,
      categoryId: 3,
      description: 'Morning coffee',
      date: new Date('2024-06-01T10:00:00.000Z'),
    });
  });

  it('strips status from request body', () => {
    const result = transactionValidator.validateCreateTransaction({
      title: 'Coffee',
      amount: 4.5,
      categoryId: 3,
      status: TransactionStatus.PENDING,
    });

    expect(result).toEqual({
      title: 'Coffee',
      amount: 4.5,
      categoryId: 3,
    });
    expect(result).not.toHaveProperty('status');
  });

  it('rejects create input without required fields', () => {
    expect(() => transactionValidator.validateCreateTransaction({})).toThrow();
  });

  it('rejects create input with zero amount', () => {
    expect(() =>
      transactionValidator.validateCreateTransaction({
        title: 'Coffee',
        amount: 0,
        categoryId: 3,
      }),
    ).toThrow();
  });

  it('rejects create input with negative amount', () => {
    expect(() =>
      transactionValidator.validateCreateTransaction({
        title: 'Coffee',
        amount: -1,
        categoryId: 3,
      }),
    ).toThrow();
  });

  it('validates update transaction input', () => {
    const result = transactionValidator.validateUpdateTransaction({
      title: 'Lunch',
      amount: 12,
      categoryId: 5,
      description: 'Updated',
      date: '2024-06-02T12:00:00.000Z',
    });

    expect(result).toEqual({
      title: 'Lunch',
      amount: 12,
      categoryId: 5,
      description: 'Updated',
      date: new Date('2024-06-02T12:00:00.000Z'),
    });
  });

  it('rejects update input with zero amount', () => {
    expect(() =>
      transactionValidator.validateUpdateTransaction({
        amount: 0,
      }),
    ).toThrow();
  });

  it('rejects update input with negative amount', () => {
    expect(() =>
      transactionValidator.validateUpdateTransaction({
        amount: -1,
      }),
    ).toThrow();
  });

  it('rejects empty update body', () => {
    expect(() => transactionValidator.validateUpdateTransaction({})).toThrow();
  });

  it('strips status from update request body', () => {
    const result = transactionValidator.validateUpdateTransaction({
      title: 'Lunch',
      status: TransactionStatus.PENDING,
    });

    expect(result).toEqual({ title: 'Lunch' });
    expect(result).not.toHaveProperty('status');
  });

  it('validates transaction id param', () => {
    const id: number = transactionValidator.validateTransactionId({ id: '20' });

    expect(id).toBe(20);
  });
});
