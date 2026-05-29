import type { IBudgetCreateInput } from '../Budget.js';

export interface IBudgetValidator {
  validateCreateBudget(body: unknown): IBudgetCreateInput;
}
