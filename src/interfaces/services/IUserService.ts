import type { IUser, IUserCreateInput, IUserLoginInput } from '../User.js';

export interface IUserService {
  create(user: IUserCreateInput): Promise<IUser>;
  login(user: IUserLoginInput): Promise<string>;
}
