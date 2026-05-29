import type { ITransactionCreateInput } from '../Transaction.js';

export interface ITransactionValidator {
  validateCreateTransaction(body: unknown): ITransactionCreateInput;
}
