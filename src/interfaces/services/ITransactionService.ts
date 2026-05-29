import type {
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
  ITransactionsByCategory,
} from '../Transaction.js';

export interface ITransactionService {
  listRecent(userId: number): Promise<ITransaction[]>;
  listCurrentMonth(userId: number): Promise<ITransactionsByCategory[]>;
  create(userId: number, data: ITransactionCreateInput): Promise<ITransaction>;
  update(userId: number, id: number, data: ITransactionUpdateInput): Promise<ITransaction>;
  delete(userId: number, id: number): Promise<void>;
}
