import type { NextFunction, Request, Response } from 'express';
import type {
  IForgotPasswordInput,
  IResetPasswordInput,
  IResendVerificationInput,
  IUserCreateInput,
  IUserLoginInput,
  IUserResponse,
  IVerifyEmailInput,
} from '../interfaces/User.js';
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
      this.created(res, user, 'User created successfully. Check your email for a verification code.');
    }, next);
  }

  async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const validatedData: IUserLoginInput = this.userValidator.validateLoginUser(req.body);
      const token: string = await this.userService.login(validatedData);
      this.ok(res, token);
    }, next);
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const validatedData: IVerifyEmailInput = this.userValidator.validateVerifyEmail(req.body);
      const user: IUserResponse = await this.userService.verifyEmail(validatedData);
      this.ok(res, user, 'Email verified successfully');
    }, next);
  }

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const validatedData: IResendVerificationInput = this.userValidator.validateResendVerification(req.body);
      await this.userService.resendVerification(validatedData);
      this.ok(res, null, 'If an unverified account exists for this email, a new verification code has been sent.');
    }, next);
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const validatedData: IForgotPasswordInput = this.userValidator.validateForgotPassword(req.body);
      await this.userService.forgotPassword(validatedData);
      this.ok(res, null, 'If an account exists for this email, a password reset code has been sent.');
    }, next);
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(async () => {
      const validatedData: IResetPasswordInput = this.userValidator.validateResetPassword(req.body);
      await this.userService.resetPassword(validatedData);
      this.ok(res, null, 'Password reset successfully');
    }, next);
  }
}
