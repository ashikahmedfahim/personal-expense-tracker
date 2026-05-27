import type { IUserCreateInput, IUserLoginInput } from '../User.js';

export interface IUserValidator {
  validateCreateUser(user: unknown): IUserCreateInput;
  validateLoginUser(user: unknown): IUserLoginInput;
}
