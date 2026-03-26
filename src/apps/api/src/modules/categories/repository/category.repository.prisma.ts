import { Injectable } from '@nestjs/common';
import type { Category } from '@prisma/client';

import type { ICategoryRepository, UpdateCategoryData } from './category.repository.interface';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTravelAndName(travelId: string, name: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { travelId, name },
    });
  }

  findByIdAndTravel(id: string, travelId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { id, travelId },
    });
  }

  create(data: {
    travelId: string;
    name: string;
    icon: string;
    color: string;
    budgetLimit: number | null;
  }): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: UpdateCategoryData): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  countExpensesByCategory(categoryId: string): Promise<number> {
    return this.prisma.expense.count({
      where: { categoryId },
    });
  }
}
