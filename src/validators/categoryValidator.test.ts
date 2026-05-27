import { describe, expect, it } from 'vitest';
import { FlowType } from '../generated/prisma/enums.js';
import { CategoryValidator } from './categoryValidator.js';

describe('CategoryValidator', () => {
  const categoryValidator = new CategoryValidator();

  it('validates create category input', () => {
    const result = categoryValidator.validateCreateCategory({
      name: 'Groceries',
      flowType: FlowType.OUTFLOW,
    });

    expect(result).toEqual({
      name: 'Groceries',
      flowType: FlowType.OUTFLOW,
    });
  });

  it('rejects create input with invalid flow type', () => {
    expect(() =>
      categoryValidator.validateCreateCategory({
        name: 'Groceries',
        flowType: 'INVALID',
      }),
    ).toThrow();
  });

  it('validates update category input with at least one field', () => {
    const result = categoryValidator.validateUpdateCategory({ name: 'Food' });

    expect(result).toEqual({ name: 'Food' });
  });

  it('rejects empty update body', () => {
    expect(() => categoryValidator.validateUpdateCategory({})).toThrow();
  });

  it('validates category id param', () => {
    const id: number = categoryValidator.validateCategoryId({ id: '12' });

    expect(id).toBe(12);
  });
});
