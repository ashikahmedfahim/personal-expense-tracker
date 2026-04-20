import { SQLDatabase } from "../database/index.js";
import type { IUser, IUserInput } from "../interfaces/User.js";

export class UserRepository {
  
  async findByEmail(email: string): Promise<IUser | null> {
    const response = await SQLDatabase.getInstance().user.findUnique({
      where: { email },
    });
    return response;
  }

  async create(user: IUserInput): Promise<IUser> {
    const response = await SQLDatabase.getInstance().user.create({
      data: user,
    });
    return response;
  }
}