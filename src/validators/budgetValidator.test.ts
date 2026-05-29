import { describe, expect, it } from 'vitest';
import { BudgetValidator } from './budgetValidator.js';

describe('BudgetValidator', () => {
  const budgetValidator = new BudgetValidator();

  it('validates create budget input', () => {
    const result = budgetValidator.validateCreateBudget({
      categoryId: 3,
      amount: 500,
      date: '2024-06-15T12:00:00.000Z',
    });

    expect(result).toEqual({
      categoryId: 3,
      amount: 500,
      date: new Date('2024-06-15T12:00:00.000Z'),
    });
  });

  it('rejects create input without required fields', () => {
    expect(() => budgetValidator.validateCreateBudget({})).toThrow();
  });

  it('rejects create input with non-positive amount', () => {
    expect(() =>
      budgetValidator.validateCreateBudget({
        categoryId: 3,
        amount: 0,
      }),
    ).toThrow();
  });
});
