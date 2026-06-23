import Joi from 'joi';
import type {
  IForgotPasswordInput,
  IResetPasswordInput,
  IResendVerificationInput,
  IUserCreateInput,
  IUserLoginInput,
  IVerifyEmailInput,
} from '../interfaces/User.js';
import type { IUserValidator } from '../interfaces/validators/IUserValidator.js';
import { BaseValidator } from './baseValidator.js';

export class UserValidator extends BaseValidator implements IUserValidator {

  private readonly createUserSchema = Joi.object({
    firstName: Joi.string().min(3).max(20).required(),
    lastName: Joi.string().min(3).max(20).required(),
    email: Joi.string().email().min(3).required(),
    password: Joi.string().min(8).max(20).required(),
  });

  private readonly loginUserSchema = Joi.object({
    email: Joi.string().email().min(3).required(),
    password: Joi.string().min(8).max(20).required(),
  });

  private readonly verifyEmailSchema = Joi.object({
    email: Joi.string().email().min(3).required(),
    code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  });

  private readonly resendVerificationSchema = Joi.object({
    email: Joi.string().email().min(3).required(),
  });

  private readonly forgotPasswordSchema = Joi.object({
    email: Joi.string().email().min(3).required(),
  });

  private readonly resetPasswordSchema = Joi.object({
    email: Joi.string().email().min(3).required(),
    code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
    password: Joi.string().min(8).max(20).required(),
  });

  validateCreateUser(user: unknown): IUserCreateInput {
    return this.validate<IUserCreateInput>(this.createUserSchema, user);
  }

  validateLoginUser(user: unknown): IUserLoginInput {
    return this.validate<IUserLoginInput>(this.loginUserSchema, user);
  }

  validateVerifyEmail(input: unknown): IVerifyEmailInput {
    return this.validate<IVerifyEmailInput>(this.verifyEmailSchema, input);
  }

  validateResendVerification(input: unknown): IResendVerificationInput {
    return this.validate<IResendVerificationInput>(this.resendVerificationSchema, input);
  }

  validateForgotPassword(input: unknown): IForgotPasswordInput {
    return this.validate<IForgotPasswordInput>(this.forgotPasswordSchema, input);
  }

  validateResetPassword(input: unknown): IResetPasswordInput {
    return this.validate<IResetPasswordInput>(this.resetPasswordSchema, input);
  }
}
