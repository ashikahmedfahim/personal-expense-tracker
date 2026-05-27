import type { NextFunction, Request, Response } from 'express';
import type { IUserController } from '../interfaces/controllers/IUserController.js';
import type { IUserService } from '../interfaces/services/IUserService.js';
import type { IUserValidator } from '../interfaces/validators/IUserValidator.js';
import { BaseController } from './baseController.js';

export class UserController extends BaseController implements IUserController {

  constructor(
    private readonly userService: IUserService,
    private readonly userValidator: IUserValidator,
  ) {
    super();
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const value = this.userValidator.validateCreateUser(req.body);
      const user = await this.userService.create(value);
      this.created(res, user);
    }, next);
  }

  async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const value = this.userValidator.validateLoginUser(req.body);
      const token = await this.userService.login(value);
      this.ok(res, token);
    }, next);
  }
}
