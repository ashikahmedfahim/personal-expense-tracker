import Joi from 'joi';
import type { ITransactionCreateInput } from '../interfaces/Transaction.js';
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

  validateCreateTransaction(body: unknown): ITransactionCreateInput {
    return this.validate<ITransactionCreateInput>(this.createTransactionSchema, body);
  }
}
