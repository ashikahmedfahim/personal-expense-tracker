import type { PrismaClient } from '../generated/prisma/client.js';
import type {
  ICategory,
  ICategoryCreateInput,
  ICategoryFieldsUpdate,
  ICategoryOrderUpdate,
} from '../interfaces/Category.js';
import type { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository.js';

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAllByUserId(userId: number): Promise<ICategory[]> {
    const response: ICategory[] = await this.db.category.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
    return response;
  }

  async findByIdAndUserId(id: number, userId: number): Promise<ICategory | null> {
    const response: ICategory | null = await this.db.category.findFirst({
      where: { id, userId },
    });
    return response;
  }

  async getLastOrderByUserId(userId: number): Promise<number> {
    const result = await this.db.category.aggregate({
      where: { userId },
      _max: { order: true },
    });
    return result._max.order ?? 0;
  }

  async create(userId: number, data: ICategoryCreateInput, order: number): Promise<ICategory> {
    const response: ICategory = await this.db.category.create({
      data: {
        ...data,
        userId,
        order,
      },
    });
    return response;
  }

  async update(id: number, userId: number, data: ICategoryFieldsUpdate): Promise<ICategory | null> {
    const existing: ICategory | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const response: ICategory = await this.db.category.update({
      where: { id },
      data,
    });
    return response;
  }

  async updateOrders(orders: ICategoryOrderUpdate[]): Promise<void> {
    if (orders.length === 0) {
      return;
    }

    await this.db.$transaction(
      orders.map(({ id, order }) =>
        this.db.category.update({
          where: { id },
          data: { order },
        }),
      ),
    );
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
