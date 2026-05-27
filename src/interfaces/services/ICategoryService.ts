import type { ICategory, ICategoryCreateInput, ICategoryUpdateInput } from '../Category.js';

export interface ICategoryService {
  list(userId: number): Promise<ICategory[]>;
  getById(userId: number, id: number): Promise<ICategory>;
  create(userId: number, data: ICategoryCreateInput): Promise<ICategory>;
  update(userId: number, id: number, data: ICategoryUpdateInput): Promise<ICategory>;
  delete(userId: number, id: number): Promise<void>;
}
