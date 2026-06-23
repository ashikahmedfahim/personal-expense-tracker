export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserResponse = Omit<IUser, 'password'>;

export function toUserResponse(user: IUser): IUserResponse {
  const { password: _, ...rest } = user;
  const userResponse: IUserResponse = rest;
  return userResponse;
}

export interface IUserCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IUserLoginInput {
  email: string;
  password: string;
}

export interface IVerifyEmailInput {
  email: string;
  code: string;
}

export interface IForgotPasswordInput {
  email: string;
}

export interface IResetPasswordInput {
  email: string;
  code: string;
  password: string;
}

export interface IResendVerificationInput {
  email: string;
}
