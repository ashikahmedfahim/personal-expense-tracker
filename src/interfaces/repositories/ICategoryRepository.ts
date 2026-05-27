import type { ICategory, ICategoryCreateInput, ICategoryUpdateInput } from '../Category.js';

export interface ICategoryRepository {
  findAllByUserId(userId: number): Promise<ICategory[]>;
  findByIdAndUserId(id: number, userId: number): Promise<ICategory | null>;
  create(userId: number, data: ICategoryCreateInput): Promise<ICategory>;
  update(id: number, userId: number, data: ICategoryUpdateInput): Promise<ICategory | null>;
  delete(id: number, userId: number): Promise<ICategory | null>;
}
