import type { ITransaction, ITransactionCreateInput, ITransactionUpdateInput } from '../Transaction.js';

export interface ITransactionService {
  create(userId: number, data: ITransactionCreateInput): Promise<ITransaction>;
  update(userId: number, id: number, data: ITransactionUpdateInput): Promise<ITransaction>;
  delete(userId: number, id: number): Promise<void>;
}
