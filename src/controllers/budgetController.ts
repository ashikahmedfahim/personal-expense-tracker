import type { NextFunction, Request, Response } from 'express';
import type { IBudgetController } from '../interfaces/controllers/IBudgetController.js';
import type { IBudgetService } from '../interfaces/services/IBudgetService.js';
import type { IBudget, IBudgetCreateInput } from '../interfaces/Budget.js';
import type { IBudgetValidator } from '../interfaces/validators/IBudgetValidator.js';
import { BaseController } from './baseController.js';

export class BudgetController extends BaseController implements IBudgetController {
  constructor(
    private readonly budgetService: IBudgetService,
    private readonly budgetValidator: IBudgetValidator,
  ) {
    super();
  }

  async createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const value: IBudgetCreateInput = this.budgetValidator.validateCreateBudget(req.body);
      const budget: IBudget = await this.budgetService.create(req.user!.id, value);
      this.created(res, budget, 'Budget created successfully');
    }, next);
  }
}
