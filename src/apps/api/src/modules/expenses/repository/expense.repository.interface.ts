import type { Expense } from '@prisma/client';

import type { ExpenseFiltersDto } from '../dto/expense-filters.dto';

import type { PaginatedResult } from '@/modules/common/types';


export interface IExpenseRepository {
  create(data: {
    travelId: string;
    memberId: string;
    categoryId: string;
    amount: number;
    description: string;
    date: Date;
  }): Promise<Expense>;

  findById(expId: string): Promise<Expense | null>;

  findAllPaginated(
    travelId: string,
    filters: ExpenseFiltersDto,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Expense>>;

  update(
    expId: string,
    data: {
      categoryId?: string;
      memberId?: string;
      amount?: number;
      description?: string;
      date?: Date;
    },
  ): Promise<Expense>;

  delete(expId: string): Promise<void>;

  categoryBelongsToTravel(categoryId: string, travelId: string): Promise<boolean>;

  memberBelongsToTravel(memberId: string, travelId: string): Promise<boolean>;
}
