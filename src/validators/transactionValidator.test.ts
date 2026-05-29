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

  it('rejects create input with non-positive amount', () => {
    expect(() =>
      transactionValidator.validateCreateTransaction({
        title: 'Coffee',
        amount: 0,
        categoryId: 3,
      }),
    ).toThrow();
  });
});
