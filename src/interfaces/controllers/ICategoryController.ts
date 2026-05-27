import type { NextFunction, Request, Response } from 'express';

export interface ICategoryController {
  listCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
  createCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void>;
}
