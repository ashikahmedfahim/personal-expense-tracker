import type {
  IForgotPasswordInput,
  IResetPasswordInput,
  IResendVerificationInput,
  IUserCreateInput,
  IUserLoginInput,
  IUserResponse,
  IVerifyEmailInput,
} from '../User.js';

export interface IUserService {
  create(user: IUserCreateInput): Promise<IUserResponse>;
  login(user: IUserLoginInput): Promise<string>;
  verifyEmail(input: IVerifyEmailInput): Promise<IUserResponse>;
  resendVerification(input: IResendVerificationInput): Promise<void>;
  forgotPassword(input: IForgotPasswordInput): Promise<void>;
  resetPassword(input: IResetPasswordInput): Promise<void>;
}
