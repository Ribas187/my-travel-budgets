import { Module } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { ExpensesController } from './expenses.controller'
import { ExpensesService } from './expenses.service'

@Module({
  imports: [CommonAuthModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
