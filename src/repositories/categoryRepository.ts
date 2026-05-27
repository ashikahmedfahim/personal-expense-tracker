import type { PrismaClient } from '../generated/prisma/client.js';
import type { ICategory, ICategoryCreateInput, ICategoryUpdateInput } from '../interfaces/Category.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAllByUserId(userId: number): Promise<ICategory[]> {
    const response: ICategory[] = await this.db.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return response;
  }

  async findByIdAndUserId(id: number, userId: number): Promise<ICategory | null> {
    const response: ICategory | null = await this.db.category.findFirst({
      where: { id, userId },
    });
    return response;
  }

  async create(userId: number, data: ICategoryCreateInput): Promise<ICategory> {
    const response: ICategory = await this.db.category.create({
      data: {
        ...data,
        userId,
      },
    });
    return response;
  }

  async update(id: number, userId: number, data: ICategoryUpdateInput): Promise<ICategory | null> {
    const existing: ICategory | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const response: ICategory = await this.db.category.update({
      where: { id },
      data,
    });
    return response;
  }

  async delete(id: number, userId: number): Promise<ICategory | null> {
    const existing: ICategory | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const response: ICategory = await this.db.category.delete({
      where: { id },
    });
    return response;
  }
}
