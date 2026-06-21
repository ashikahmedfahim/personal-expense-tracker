import type { FlowType } from '../generated/prisma/enums.js';

export interface IBudget {
  id: number;
  amount: number;
  date: Date;
  categoryId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudgetCreateInput {
  categoryId: number;
  amount: number;
  date?: Date;
}

export interface IBudgetUpdateInput {
  amount: number;
}

export interface IBudgetCategorySummary {
  id: number;
  name: string;
  flowType: FlowType;
  order: number;
}

export interface IBudgetWithCategory {
  budget: IBudget;
  category: IBudgetCategorySummary;
}

export interface ICurrentMonthBudgetItem {
  budget: IBudget;
  category: IBudgetCategorySummary;
  spent: number;
  remaining: number;
}

export interface ICurrentMonthBudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
}

export interface ICurrentMonthBudgetOverview {
  month: string;
  summary: ICurrentMonthBudgetSummary;
  budgets: ICurrentMonthBudgetItem[];
}

export interface IOverallBudgetAllocation {
  category: IBudgetCategorySummary;
  amount: number;
}

export interface IOverallBudgetView {
  month: string;
  totalIncome: number;
  totalAllocated: number;
  netBalance: number;
  income: IOverallBudgetAllocation[];
  allocations: IOverallBudgetAllocation[];
}
