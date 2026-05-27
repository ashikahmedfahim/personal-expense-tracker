import type { ICategory, ICategoryCreateInput, ICategoryUpdateInput } from '../interfaces/Category.js';
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
    const category: ICategory = await this.categoryRepository.create(userId, data);
    return category;
  }

  async update(userId: number, id: number, data: ICategoryUpdateInput): Promise<ICategory> {
    const category: ICategory | null = await this.categoryRepository.update(id, userId, data);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
    return category;
  }

  async delete(userId: number, id: number): Promise<void> {
    const category: ICategory | null = await this.categoryRepository.delete(id, userId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
  }
}
