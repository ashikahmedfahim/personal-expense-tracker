import { SQLDatabase } from '../database/index.js';
import type { IUser, IUserCreateInput } from '../interfaces/User.js';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository.js';

export class UserRepository implements IUserRepository {

  async findByEmail(email: string): Promise<IUser | null> {
    const response = await SQLDatabase.getInstance().user.findUnique({
      where: { email },
    });
    return response;
  }

  async create(user: IUserCreateInput): Promise<IUser> {
    const response = await SQLDatabase.getInstance().user.create({
      data: user,
    });
    return response;
  }
}
