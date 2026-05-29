import type { IBudgetCreateInput, IBudgetUpdateInput } from '../Budget.js';

export interface IBudgetValidator {
  validateCreateBudget(body: unknown): IBudgetCreateInput;
  validateUpdateBudget(body: unknown): IBudgetUpdateInput;
  validateBudgetId(params: unknown): number;
}
