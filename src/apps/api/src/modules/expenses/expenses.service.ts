import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Expense, TravelMember } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';
import type { ExpenseFiltersDto } from './dto/expense-filters.dto';

import { PrismaService } from '@/modules/prisma/prisma.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(travelId: string, memberId: string, dto: CreateExpenseDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, travelId },
    });

    if (!category) {
      throw new BadRequestException('Category not found in this travel');
    }

    const expense = await this.prisma.expense.create({
      data: {
        travelId,
        memberId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        description: dto.description,
        date: new Date(dto.date),
      },
    });

    return this.serializeExpense(expense);
  }

  async findAll(
    travelId: string,
    filters: ExpenseFiltersDto,
  ): Promise<PaginatedResult<ReturnType<ExpensesService['serializeExpense']>>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
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

    const [total, expenses] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: expenses.map((e) => this.serializeExpense(e)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(expId: string, currentMember: TravelMember, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id: expId } });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.memberId !== currentMember.id && currentMember.role !== 'owner') {
      throw new ForbiddenException('You can only edit your own expenses');
    }

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, travelId: expense.travelId },
      });
      if (!category) {
        throw new BadRequestException('Category not found in this travel');
      }
    }

    const updated = await this.prisma.expense.update({
      where: { id: expId },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
      },
    });

    return this.serializeExpense(updated);
  }

  async remove(expId: string, currentMember: TravelMember): Promise<void> {
    const expense = await this.prisma.expense.findUnique({ where: { id: expId } });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.memberId !== currentMember.id && currentMember.role !== 'owner') {
      throw new ForbiddenException('You can only delete your own expenses');
    }

    await this.prisma.expense.delete({ where: { id: expId } });
  }

  private serializeExpense(expense: Expense) {
    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }
}
