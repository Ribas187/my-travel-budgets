import { Module } from '@nestjs/common';

import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

import { CommonAuthModule } from '@/modules/common/auth';

@Module({
  imports: [CommonAuthModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
