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

  it('validates update budget input', () => {
    const result = budgetValidator.validateUpdateBudget({ amount: 750 });

    expect(result).toEqual({ amount: 750 });
  });

  it('rejects update input without amount', () => {
    expect(() => budgetValidator.validateUpdateBudget({})).toThrow();
  });

  it('strips fields other than amount from update body', () => {
    const result = budgetValidator.validateUpdateBudget({
      amount: 750,
      categoryId: 3,
      date: '2024-06-01T00:00:00.000Z',
    });

    expect(result).toEqual({ amount: 750 });
    expect(result).not.toHaveProperty('categoryId');
  });

  it('validates budget id param', () => {
    const id: number = budgetValidator.validateBudgetId({ id: '5' });

    expect(id).toBe(5);
  });
});
