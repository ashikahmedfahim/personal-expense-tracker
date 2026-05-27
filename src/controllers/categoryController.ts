import type { NextFunction, Request, Response } from 'express';
import type {
  ICategory,
  ICategoryCreateInput,
  ICategoryUpdateInput,
} from '../interfaces/Category.js';
import type { ICategoryController } from '../interfaces/controllers/ICategoryController.js';
import type { ICategoryService } from '../interfaces/services/ICategoryService.js';
import type { ICategoryValidator } from '../interfaces/validators/ICategoryValidator.js';
import { BaseController } from './baseController.js';

export class CategoryController extends BaseController implements ICategoryController {
  constructor(
    private readonly categoryService: ICategoryService,
    private readonly categoryValidator: ICategoryValidator,
  ) {
    super();
  }

  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const categories: ICategory[] = await this.categoryService.list(req.user!.id);
      this.ok(res, categories);
    }, next);
  }

  async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.categoryValidator.validateCategoryId(req.params);
      const category: ICategory = await this.categoryService.getById(req.user!.id, id);
      this.ok(res, category);
    }, next);
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const value: ICategoryCreateInput = this.categoryValidator.validateCreateCategory(req.body);
      const category: ICategory = await this.categoryService.create(req.user!.id, value);
      this.created(res, category, 'Category created successfully');
    }, next);
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.categoryValidator.validateCategoryId(req.params);
      const value: ICategoryUpdateInput = this.categoryValidator.validateUpdateCategory(req.body);
      const category: ICategory = await this.categoryService.update(req.user!.id, id, value);
      this.ok(res, category, 'Category updated successfully');
    }, next);
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.categoryValidator.validateCategoryId(req.params);
      await this.categoryService.delete(req.user!.id, id);
      this.ok(res, null, 'Category deleted successfully');
    }, next);
  }
}
