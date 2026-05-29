import Joi from 'joi';
import type { ITransactionCreateInput, ITransactionUpdateInput } from '../interfaces/Transaction.js';
import type { ITransactionValidator } from '../interfaces/validators/ITransactionValidator.js';
import { BaseValidator } from './baseValidator.js';

export class TransactionValidator extends BaseValidator implements ITransactionValidator {
  private readonly createTransactionSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    amount: Joi.number().positive().required(),
    categoryId: Joi.number().integer().positive().required(),
    description: Joi.string().trim().max(500).allow('', null),
    date: Joi.date().iso(),
  });

  private readonly updateTransactionSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200),
    amount: Joi.number().positive(),
    categoryId: Joi.number().integer().positive(),
    description: Joi.string().trim().max(500).allow('', null),
    date: Joi.date().iso(),
  }).min(1);

  private readonly transactionIdSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
  });

  validateCreateTransaction(body: unknown): ITransactionCreateInput {
    return this.validate<ITransactionCreateInput>(this.createTransactionSchema, body);
  }

  validateUpdateTransaction(body: unknown): ITransactionUpdateInput {
    return this.validate<ITransactionUpdateInput>(this.updateTransactionSchema, body);
  }

  validateTransactionId(params: unknown): number {
    const value: { id: number } = this.validate<{ id: number }>(this.transactionIdSchema, params);
    return value.id;
  }
}
