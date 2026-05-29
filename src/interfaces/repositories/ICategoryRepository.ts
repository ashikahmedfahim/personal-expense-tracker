import type {
  ICategory,
  ICategoryCreateInput,
  ICategoryFieldsUpdate,
  ICategoryOrderUpdate,
} from '../Category.js';

export interface ICategoryRepository {
  findAllByUserId(userId: number): Promise<ICategory[]>;
  findByIdAndUserId(id: number, userId: number): Promise<ICategory | null>;
  getLastOrderByUserId(userId: number): Promise<number>;
  create(userId: number, data: ICategoryCreateInput, order: number): Promise<ICategory>;
  update(id: number, userId: number, data: ICategoryFieldsUpdate): Promise<ICategory | null>;
  updateOrders(orders: ICategoryOrderUpdate[]): Promise<void>;
  delete(id: number, userId: number): Promise<ICategory | null>;
}
