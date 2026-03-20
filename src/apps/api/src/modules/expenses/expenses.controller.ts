import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { TravelMember } from '@prisma/client';

import type { ExpensesService } from './expenses.service';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';
import type { ExpenseFiltersDto } from './dto/expense-filters.dto';

import { CurrentTravelMember, JwtAuthGuard, TravelMemberGuard } from '@/modules/common/auth';

@Controller('travels/:travelId/expenses')
@UseGuards(JwtAuthGuard, TravelMemberGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Param('travelId') travelId: string,
    @CurrentTravelMember() currentMember: TravelMember,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(travelId, currentMember.id, dto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(@Param('travelId') travelId: string, @Query() filters: ExpenseFiltersDto) {
    return this.expensesService.findAll(travelId, filters);
  }

  @Patch(':expId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('expId') expId: string,
    @CurrentTravelMember() currentMember: TravelMember,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(expId, currentMember, dto);
  }

  @Delete(':expId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('expId') expId: string, @CurrentTravelMember() currentMember: TravelMember) {
    await this.expensesService.remove(expId, currentMember);
  }
}
