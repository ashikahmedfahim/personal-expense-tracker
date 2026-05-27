import type { IUserCreateInput, IUserLoginInput, IUserResponse } from '../User.js';

export interface IUserService {
  create(user: IUserCreateInput): Promise<IUserResponse>;
  login(user: IUserLoginInput): Promise<string>;
}
