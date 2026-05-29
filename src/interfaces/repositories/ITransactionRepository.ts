import type { ITransaction, ITransactionCreateInput } from '../Transaction.js';

export interface ITransactionRepository {
  create(userId: number, data: ITransactionCreateInput): Promise<ITransaction>;
}
