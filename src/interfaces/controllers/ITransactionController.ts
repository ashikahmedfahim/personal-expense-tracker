import type { NextFunction, Request, Response } from 'express';

export interface ITransactionController {
  createTransaction(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void>;
}
