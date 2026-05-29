import type { NextFunction, Request, Response } from 'express';
import type { IUserCreateInput, IUserLoginInput, IUserResponse } from '../interfaces/User.js';
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
      const validatedData: IUserCreateInput = this.userValidator.validateCreateUser(req.body);
      const user: IUserResponse = await this.userService.create(validatedData);
      this.created(res, user, 'User created successfully');
    }, next);
  }

  async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const validatedData: IUserLoginInput = this.userValidator.validateLoginUser(req.body);
      const token: string = await this.userService.login(validatedData);
      this.ok(res, token);
    }, next);
  }
}
