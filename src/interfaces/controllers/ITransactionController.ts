import type { NextFunction, Request, Response } from 'express';

export interface ITransactionController {
  listRecentTransactions(req: Request, res: Response, next: NextFunction): Promise<void>;
  createTransaction(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void>;
}
