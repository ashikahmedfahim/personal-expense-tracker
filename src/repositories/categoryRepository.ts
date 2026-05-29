import type { PrismaClient } from '../generated/prisma/client.js';
import type { ICategory, ICategoryCreateInput, ICategoryUpdateInput } from '../interfaces/Category.js';
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

  async create(userId: number, data: ICategoryCreateInput): Promise<ICategory> {
    const order: number = await this.getNextOrder(userId);
    const response: ICategory = await this.db.category.create({
      data: {
        ...data,
        userId,
        order,
      },
    });
    return response;
  }

  async update(id: number, userId: number, data: ICategoryUpdateInput): Promise<ICategory | null> {
    const existing: ICategory | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const { order, ...rest } = data;

    if (order !== undefined) {
      await this.reorder(userId, id, order);
    }

    if (Object.keys(rest).length > 0) {
      await this.db.category.update({
        where: { id },
        data: rest,
      });
    }

    return this.findByIdAndUserId(id, userId);
  }

  async delete(id: number, userId: number): Promise<ICategory | null> {
    const existing: ICategory | null = await this.findByIdAndUserId(id, userId);
    if (!existing) {
      return null;
    }

    const response: ICategory = await this.db.category.delete({
      where: { id },
    });

    await this.compactOrders(userId);
    return response;
  }

  private async getNextOrder(userId: number): Promise<number> {
    const result = await this.db.category.aggregate({
      where: { userId },
      _max: { order: true },
    });
    return (result._max.order ?? 0) + 1;
  }

  private async reorder(userId: number, categoryId: number, newOrder: number): Promise<void> {
    const categories: ICategory[] = await this.db.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    const currentIndex: number = categories.findIndex((category) => category.id === categoryId);
    if (currentIndex === -1) {
      return;
    }

    const [moved] = categories.splice(currentIndex, 1);
    if (!moved) {
      return;
    }

    const targetIndex: number = Math.min(Math.max(newOrder - 1, 0), categories.length);
    categories.splice(targetIndex, 0, moved);

    await this.db.$transaction(
      categories.map((category, index) =>
        this.db.category.update({
          where: { id: category.id },
          data: { order: index + 1 },
        }),
      ),
    );
  }

  private async compactOrders(userId: number): Promise<void> {
    const categories: ICategory[] = await this.db.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    await this.db.$transaction(
      categories.map((category, index) =>
        this.db.category.update({
          where: { id: category.id },
          data: { order: index + 1 },
        }),
      ),
    );
  }
}
