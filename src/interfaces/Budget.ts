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
