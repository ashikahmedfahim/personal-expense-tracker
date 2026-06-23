import type { IUser, IUserCreateInput } from '../User.js';

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  create(user: IUserCreateInput): Promise<IUser>;
  markEmailVerified(userId: number): Promise<IUser>;
  updatePassword(userId: number, password: string): Promise<IUser>;
}
