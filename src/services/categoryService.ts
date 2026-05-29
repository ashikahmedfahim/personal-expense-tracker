import type {
  ICategory,
  ICategoryCreateInput,
  ICategoryFieldsUpdate,
  ICategoryOrderUpdate,
  ICategoryUpdateInput,
} from '../interfaces/Category.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';
import type { ICategoryService } from '../interfaces/services/ICategoryService.js';
import { AppError } from '../utils/errors.js';

export class CategoryService implements ICategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async list(userId: number): Promise<ICategory[]> {
    const categories: ICategory[] = await this.categoryRepository.findAllByUserId(userId);
    return categories;
  }

  async getById(userId: number, id: number): Promise<ICategory> {
    const category: ICategory | null = await this.categoryRepository.findByIdAndUserId(id, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
    return category;
  }

  async create(userId: number, data: ICategoryCreateInput): Promise<ICategory> {
    const order: number = await this.getNextOrder(userId);
    const category: ICategory = await this.categoryRepository.create(userId, data, order);
    return category;
  }

  async update(userId: number, id: number, data: ICategoryUpdateInput): Promise<ICategory> {
    const existing: ICategory | null = await this.categoryRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new AppError(404, 'Category not found');
    }

    const { order, ...fields } = data;

    if (order !== undefined) {
      await this.reorder(userId, id, order);
    }

    const fieldUpdates: ICategoryFieldsUpdate = fields;
    if (Object.keys(fieldUpdates).length > 0) {
      const updated: ICategory | null = await this.categoryRepository.update(id, userId, fieldUpdates);
      if (!updated) {
        throw new AppError(404, 'Category not found');
      }
    }

    return this.getById(userId, id);
  }

  async delete(userId: number, id: number): Promise<void> {
    const category: ICategory | null = await this.categoryRepository.delete(id, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    await this.compactOrders(userId);
  }

  private async getNextOrder(userId: number): Promise<number> {
    const lastOrder: number = await this.categoryRepository.getLastOrderByUserId(userId);
    return lastOrder + 1;
  }

  private async reorder(userId: number, categoryId: number, newOrder: number): Promise<void> {
    const categories: ICategory[] = await this.categoryRepository.findAllByUserId(userId);
    const currentIndex: number = categories.findIndex((category) => category.id === categoryId);
    if (currentIndex === -1) {
      return;
    }

    const [moved] = categories.splice(currentIndex, 1);
    if (!moved) {
      return;
    }

    const targetIndex: number = Math.min(Math.max(newOrder - 1, 0), categories.length);
    categories.splice(targetIndex, 0, moved);

    const orders: ICategoryOrderUpdate[] = categories.map((category, index) => ({
      id: category.id,
      order: index + 1,
    }));
    await this.categoryRepository.updateOrders(orders);
  }

  private async compactOrders(userId: number): Promise<void> {
    const categories: ICategory[] = await this.categoryRepository.findAllByUserId(userId);
    const orders: ICategoryOrderUpdate[] = categories.map((category, index) => ({
      id: category.id,
      order: index + 1,
    }));
    await this.categoryRepository.updateOrders(orders);
  }
}
