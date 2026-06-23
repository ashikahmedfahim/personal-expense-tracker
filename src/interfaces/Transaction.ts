import type { FlowType, TransactionStatus } from '../generated/prisma/enums.js';

export type { FlowType, TransactionStatus };

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

export interface ICurrentMonthTransaction {
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

export interface ICurrentMonthCategoryWithTransactions {
  id: number;
  name: string;
  flowType: FlowType;
  order: number;
  transactions: ICurrentMonthTransaction[];
}

export interface ITransactionsByCategory {
  category: ICurrentMonthCategoryWithTransactions;
}

export interface ITransactionWithCategory {
  transaction: ICurrentMonthTransaction;
  category: Pick<ICurrentMonthCategoryWithTransactions, 'id' | 'name' | 'flowType' | 'order'>;
}

export interface ITransactionDailyAmount {
  date: Date;
  amount: number;
}

export interface IDailyExpenseTotal {
  date: string;
  total: number;
}

export interface ICategorySpendingTotal {
  categoryId: number;
  total: number;
}

export interface ITransactionOverviewCategoryTotal {
  category: Pick<ICurrentMonthCategoryWithTransactions, 'id' | 'name' | 'flowType' | 'order'>;
  total: number;
}

export interface ICurrentMonthTransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netBalance: number;
}

export interface ICurrentMonthTransactionOverview {
  month: string;
  summary: ICurrentMonthTransactionSummary;
  categories: ITransactionOverviewCategoryTotal[];
}
