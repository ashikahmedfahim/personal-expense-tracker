import type { NextFunction, Request, Response } from 'express';
import type { ITransactionController } from '../interfaces/controllers/ITransactionController.js';
import type { ITransactionService } from '../interfaces/services/ITransactionService.js';
import type {
  IDailyExpenseTotal,
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
  ITransactionsByCategory,
} from '../interfaces/Transaction.js';
import type { ITransactionValidator } from '../interfaces/validators/ITransactionValidator.js';
import { BaseController } from './baseController.js';

export class TransactionController extends BaseController implements ITransactionController {
  constructor(
    private readonly transactionService: ITransactionService,
    private readonly transactionValidator: ITransactionValidator,
  ) {
    super();
  }

  async listRecentTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const transactions: ITransaction[] = await this.transactionService.listRecent(req.user!.id);
      this.ok(res, transactions);
    }, next);
  }

  async listCurrentMonthTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const groups: ITransactionsByCategory[] = await this.transactionService.listCurrentMonth(req.user!.id);
      this.ok(res, groups);
    }, next);
  }

  async getCurrentMonthOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const overview = await this.transactionService.getCurrentMonthOverview(req.user!.id);
      this.ok(res, overview);
    }, next);
  }

  async getCurrentMonthDailyTotals(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const totals: IDailyExpenseTotal[] = await this.transactionService.getCurrentMonthDailyTotals(req.user!.id);
      this.ok(res, totals);
    }, next);
  }

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const validatedData: ITransactionCreateInput = this.transactionValidator.validateCreateTransaction(req.body);
      const transaction: ITransaction = await this.transactionService.create(req.user!.id, validatedData);
      this.created(res, transaction, 'Transaction created successfully');
    }, next);
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.transactionValidator.validateTransactionId(req.params);
      const validatedData: ITransactionUpdateInput = this.transactionValidator.validateUpdateTransaction(req.body);
      const transaction: ITransaction = await this.transactionService.update(req.user!.id, id, validatedData);
      this.ok(res, transaction, 'Transaction updated successfully');
    }, next);
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.transactionValidator.validateTransactionId(req.params);
      await this.transactionService.delete(req.user!.id, id);
      this.ok(res, null, 'Transaction deleted successfully');
    }, next);
  }
}
