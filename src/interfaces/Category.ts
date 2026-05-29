import type { FlowType } from '../generated/prisma/enums.js';

export type { FlowType };

export interface ICategory {
  id: number;
  name: string;
  flowType: FlowType;
  order: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryCreateInput {
  name: string;
  flowType: FlowType;
}

export interface ICategoryUpdateInput {
  name?: string;
  flowType?: FlowType;
  order?: number;
}

export type ICategoryFieldsUpdate = Omit<ICategoryUpdateInput, 'order'>;

export interface ICategoryOrderUpdate {
  id: number;
  order: number;
}
