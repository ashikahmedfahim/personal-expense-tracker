import type {
  IForgotPasswordInput,
  IResetPasswordInput,
  IResendVerificationInput,
  IUserCreateInput,
  IUserLoginInput,
  IVerifyEmailInput,
} from '../User.js';

export interface IUserValidator {
  validateCreateUser(user: unknown): IUserCreateInput;
  validateLoginUser(user: unknown): IUserLoginInput;
  validateVerifyEmail(input: unknown): IVerifyEmailInput;
  validateResendVerification(input: unknown): IResendVerificationInput;
  validateForgotPassword(input: unknown): IForgotPasswordInput;
  validateResetPassword(input: unknown): IResetPasswordInput;
}
