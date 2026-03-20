import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import {
  CheckPolicy,
  IsTravelOwnerPolicy,
  JwtAuthGuard,
  PolicyGuard,
  TravelMemberGuard,
} from '@/modules/common/auth';

@Controller('travels/:travelId/categories')
@UseGuards(JwtAuthGuard, TravelMemberGuard, PolicyGuard)
@CheckPolicy(IsTravelOwnerPolicy)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Param('travelId') travelId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(travelId, dto);
  }

  @Patch(':catId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('travelId') travelId: string,
    @Param('catId') catId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(travelId, catId, dto);
  }

  @Delete(':catId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('travelId') travelId: string, @Param('catId') catId: string) {
    await this.categoriesService.remove(travelId, catId);
  }
}
