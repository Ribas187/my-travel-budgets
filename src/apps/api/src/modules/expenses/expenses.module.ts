import { Module } from '@nestjs/common';

import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { PrismaExpenseRepository } from './repository/expense.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { EXPENSE_REPOSITORY } from '@/modules/common/database';

@Module({
  imports: [CommonAuthModule],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    { provide: EXPENSE_REPOSITORY, useClass: PrismaExpenseRepository },
  ],
})
export class ExpensesModule {}
