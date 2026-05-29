import type { NextFunction, Request, Response } from 'express';

export interface IBudgetController {
  createBudget(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateBudget(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void>;
}
