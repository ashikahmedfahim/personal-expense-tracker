import type { ITransaction, ITransactionCreateInput } from '../Transaction.js';

export interface ITransactionService {
  create(userId: number, data: ITransactionCreateInput): Promise<ITransaction>;
}
