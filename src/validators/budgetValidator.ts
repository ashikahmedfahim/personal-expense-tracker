import Joi from 'joi';
import type { IBudgetCreateInput } from '../interfaces/Budget.js';
import type { IBudgetValidator } from '../interfaces/validators/IBudgetValidator.js';
import { BaseValidator } from './baseValidator.js';

export class BudgetValidator extends BaseValidator implements IBudgetValidator {
  private readonly createBudgetSchema = Joi.object({
    categoryId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    date: Joi.date().iso(),
  });

  validateCreateBudget(body: unknown): IBudgetCreateInput {
    return this.validate<IBudgetCreateInput>(this.createBudgetSchema, body);
  }
}
