import type { ITransaction, ITransactionCreateInput, ITransactionUpdateInput } from '../Transaction.js';

export interface ITransactionRepository {
  findByIdAndUserId(id: number, userId: number): Promise<ITransaction | null>;
  create(userId: number, data: ITransactionCreateInput): Promise<ITransaction>;
  update(id: number, userId: number, data: ITransactionUpdateInput): Promise<ITransaction | null>;
  delete(id: number, userId: number): Promise<ITransaction | null>;
}
