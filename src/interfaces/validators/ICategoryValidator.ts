import type { ICategoryCreateInput, ICategoryUpdateInput } from '../Category.js';

export interface ICategoryValidator {
  validateCreateCategory(body: unknown): ICategoryCreateInput;
  validateUpdateCategory(body: unknown): ICategoryUpdateInput;
  validateCategoryId(params: unknown): number;
}
