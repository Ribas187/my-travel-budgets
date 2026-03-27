import { Inject, Injectable } from '@nestjs/common';
import type { TravelMember } from '@prisma/client';

import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';
import type { ExpenseFiltersDto } from './dto/expense-filters.dto';
import type { IExpenseRepository } from './repository/expense.repository.interface';

import { EXPENSE_REPOSITORY } from '@/modules/common/database';
import {
  BusinessValidationError,
  EntityNotFoundError,
  ForbiddenError,
} from '@/modules/common/exceptions';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async create(travelId: string, memberId: string, dto: CreateExpenseDto) {
    const belongs = await this.expenseRepository.categoryBelongsToTravel(dto.categoryId, travelId);

    if (!belongs) {
      throw new BusinessValidationError('Category not found in this travel');
    }

    if (memberId) {
      const memberBelongs = await this.expenseRepository.memberBelongsToTravel(memberId, travelId);

      if (!memberBelongs) {
        throw new BusinessValidationError('Member not found in this travel');
      }
    }

    return this.expenseRepository.create({
      travelId,
      memberId,
      categoryId: dto.categoryId,
      amount: dto.amount,
      description: dto.description,
      date: new Date(dto.date),
    });
  }

  async findAll(travelId: string, filters: ExpenseFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    return this.expenseRepository.findAllPaginated(travelId, filters, { page, limit });
  }

  async update(expId: string, currentMember: TravelMember, dto: UpdateExpenseDto) {
    const expense = await this.expenseRepository.findById(expId);

    if (!expense) {
      throw new EntityNotFoundError('Expense');
    }

    if (expense.memberId !== currentMember.id && currentMember.role !== 'owner') {
      throw new ForbiddenError('You can only edit your own expenses');
    }

    if (dto.categoryId !== undefined) {
      const belongs = await this.expenseRepository.categoryBelongsToTravel(
        dto.categoryId,
        expense.travelId,
      );
      if (!belongs) {
        throw new BusinessValidationError('Category not found in this travel');
      }
    }

    if (dto.memberId !== undefined) {
      const memberBelongs = await this.expenseRepository.memberBelongsToTravel(
        dto.memberId,
        expense.travelId,
      );
      if (!memberBelongs) {
        throw new BusinessValidationError('Member not found in this travel');
      }
    }

    return this.expenseRepository.update(expId, {
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.memberId !== undefined && { memberId: dto.memberId }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.date !== undefined && { date: new Date(dto.date) }),
    });
  }

  async remove(expId: string, currentMember: TravelMember): Promise<void> {
    const expense = await this.expenseRepository.findById(expId);

    if (!expense) {
      throw new EntityNotFoundError('Expense');
    }

    if (expense.memberId !== currentMember.id && currentMember.role !== 'owner') {
      throw new ForbiddenError('You can only delete your own expenses');
    }

    await this.expenseRepository.delete(expId);
  }
}
