import type {
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
  ITransactionWithCategory,
} from '../Transaction.js';

export interface ITransactionRepository {
  findRecentByUserId(userId: number, limit: number): Promise<ITransaction[]>;
  findRecentInDateRangeByUserId(
    userId: number,
    start: Date,
    end: Date,
    limit: number,
  ): Promise<ITransactionWithCategory[]>;
  findByIdAndUserId(id: number, userId: number): Promise<ITransaction | null>;
  create(userId: number, data: ITransactionCreateInput): Promise<ITransaction>;
  update(id: number, userId: number, data: ITransactionUpdateInput): Promise<ITransaction | null>;
  delete(id: number, userId: number): Promise<ITransaction | null>;
}
