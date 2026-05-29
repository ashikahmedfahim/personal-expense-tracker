import type { NextFunction, Request, Response } from 'express';
import type { ITransactionController } from '../interfaces/controllers/ITransactionController.js';
import type { ITransactionService } from '../interfaces/services/ITransactionService.js';
import type {
  ITransaction,
  ITransactionCreateInput,
  ITransactionUpdateInput,
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

  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const value: ITransactionCreateInput = this.transactionValidator.validateCreateTransaction(req.body);
      const transaction: ITransaction = await this.transactionService.create(req.user!.id, value);
      this.created(res, transaction, 'Transaction created successfully');
    }, next);
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.transactionValidator.validateTransactionId(req.params);
      const value: ITransactionUpdateInput = this.transactionValidator.validateUpdateTransaction(req.body);
      const transaction: ITransaction = await this.transactionService.update(req.user!.id, id, value);
      this.ok(res, transaction, 'Transaction updated successfully');
    }, next);
  }
}
