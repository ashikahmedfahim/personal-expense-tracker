import Joi from 'joi';
import { FlowType } from '../generated/prisma/enums.js';
import type { ICategoryCreateInput, ICategoryUpdateInput } from '../interfaces/Category.js';
import type { ICategoryValidator } from '../interfaces/validators/ICategoryValidator.js';
import { BaseValidator } from './baseValidator.js';

const flowTypeSchema = Joi.string().valid(FlowType.INFLOW, FlowType.OUTFLOW);

export class CategoryValidator extends BaseValidator implements ICategoryValidator {
  private readonly createCategorySchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    flowType: flowTypeSchema.required(),
  });

  private readonly updateCategorySchema = Joi.object({
    name: Joi.string().trim().min(1).max(100),
    flowType: flowTypeSchema,
    order: Joi.number().integer().positive(),
  }).min(1);

  private readonly categoryIdSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
  });

  validateCreateCategory(body: unknown): ICategoryCreateInput {
    return this.validate<ICategoryCreateInput>(this.createCategorySchema, body);
  }

  validateUpdateCategory(body: unknown): ICategoryUpdateInput {
    return this.validate<ICategoryUpdateInput>(this.updateCategorySchema, body);
  }

  validateCategoryId(params: unknown): number {
    const value: { id: number } = this.validate<{ id: number }>(this.categoryIdSchema, params);
    return value.id;
  }
}
