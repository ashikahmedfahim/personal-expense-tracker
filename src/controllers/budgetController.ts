import type { NextFunction, Request, Response } from 'express';
import type { IBudgetController } from '../interfaces/controllers/IBudgetController.js';
import type { IBudgetService } from '../interfaces/services/IBudgetService.js';
import type { IBudget, IBudgetCreateInput, IBudgetUpdateInput } from '../interfaces/Budget.js';
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
      const validatedData: IBudgetCreateInput = this.budgetValidator.validateCreateBudget(req.body);
      const budget: IBudget = await this.budgetService.create(req.user!.id, validatedData);
      this.created(res, budget, 'Budget created successfully');
    }, next);
  }

  async updateBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.budgetValidator.validateBudgetId(req.params);
      const validatedData: IBudgetUpdateInput = this.budgetValidator.validateUpdateBudget(req.body);
      const budget: IBudget = await this.budgetService.update(req.user!.id, id, validatedData);
      this.ok(res, budget, 'Budget updated successfully');
    }, next);
  }

  async deleteBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const id: number = this.budgetValidator.validateBudgetId(req.params);
      await this.budgetService.delete(req.user!.id, id);
      this.ok(res, null, 'Budget deleted successfully');
    }, next);
  }
}
