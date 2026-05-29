import Joi from 'joi';
import type { IBudgetCreateInput, IBudgetUpdateInput } from '../interfaces/Budget.js';
import type { IBudgetValidator } from '../interfaces/validators/IBudgetValidator.js';
import { BaseValidator } from './baseValidator.js';

export class BudgetValidator extends BaseValidator implements IBudgetValidator {
  private readonly createBudgetSchema = Joi.object({
    categoryId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    date: Joi.date().iso(),
  });

  private readonly updateBudgetSchema = Joi.object({
    amount: Joi.number().positive().required(),
  });

  private readonly budgetIdSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
  });

  validateCreateBudget(body: unknown): IBudgetCreateInput {
    return this.validate<IBudgetCreateInput>(this.createBudgetSchema, body);
  }

  validateUpdateBudget(body: unknown): IBudgetUpdateInput {
    return this.validate<IBudgetUpdateInput>(this.updateBudgetSchema, body);
  }

  validateBudgetId(params: unknown): number {
    const validatedData: { id: number } = this.validate<{ id: number }>(this.budgetIdSchema, params);
    return validatedData.id;
  }
}
