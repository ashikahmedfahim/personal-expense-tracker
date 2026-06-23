import type { PrismaClient } from '../generated/prisma/client.js';
import type { IUser, IUserCreateInput } from '../interfaces/User.js';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository.js';

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<IUser | null> {
    const response: IUser | null = await this.db.user.findUnique({
      where: { email },
    });
    return response;
  }

  async create(user: IUserCreateInput): Promise<IUser> {
    const response: IUser = await this.db.user.create({
      data: user,
    });
    return response;
  }

  async markEmailVerified(userId: number): Promise<IUser> {
    return this.db.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  async updatePassword(userId: number, password: string): Promise<IUser> {
    return this.db.user.update({
      where: { id: userId },
      data: { password },
    });
  }
}
