import type { ITransactionCreateInput, ITransactionUpdateInput } from '../Transaction.js';

export interface ITransactionValidator {
  validateCreateTransaction(body: unknown): ITransactionCreateInput;
  validateUpdateTransaction(body: unknown): ITransactionUpdateInput;
  validateTransactionId(params: unknown): number;
}
