import type { TransactionStatus } from '../generated/prisma/enums.js';

export type { TransactionStatus };

export interface ITransaction {
  id: number;
  title: string;
  amount: number;
  description: string | null;
  date: Date;
  status: TransactionStatus;
  categoryId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionCreateInput {
  title: string;
  amount: number;
  categoryId: number;
  description?: string;
  date?: Date;
}

export interface ITransactionUpdateInput {
  title?: string;
  amount?: number;
  categoryId?: number;
  description?: string | null;
  date?: Date;
}
