import { Injectable } from '@nestjs/common';
import type { Expense, Prisma } from '@prisma/client';

import type { ExpenseFiltersDto } from '../dto/expense-filters.dto';

import type { IExpenseRepository } from './expense.repository.interface';

import type { PaginatedResult } from '@/modules/common/types';
import { PrismaService } from '@/modules/prisma/prisma.service';


@Injectable()
export class PrismaExpenseRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    travelId: string;
    memberId: string;
    categoryId: string;
    amount: number;
    description: string;
    date: Date;
  }): Promise<Expense> {
    return this.prisma.expense.create({ data });
  }

  findById(expId: string): Promise<Expense | null> {
    return this.prisma.expense.findUnique({ where: { id: expId } });
  }

  async findAllPaginated(
    travelId: string,
    filters: ExpenseFiltersDto,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Expense>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = { travelId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.memberId) where.memberId = filters.memberId;
    if (filters.startDate ?? filters.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      where.date = dateFilter;
    }

    const [total, data] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  update(
    expId: string,
    data: {
      categoryId?: string;
      amount?: number;
      description?: string;
      date?: Date;
    },
  ): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id: expId },
      data,
    });
  }

  async delete(expId: string): Promise<void> {
    await this.prisma.expense.delete({ where: { id: expId } });
  }

  async categoryBelongsToTravel(categoryId: string, travelId: string): Promise<boolean> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, travelId },
    });
    return category !== null;
  }
}
