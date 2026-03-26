import { Inject, Injectable } from '@nestjs/common';

import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import type { ICategoryRepository } from './repository/category.repository.interface';

import { CATEGORY_REPOSITORY } from '@/modules/common/database';
import { ConflictError, EntityNotFoundError } from '@/modules/common/exceptions';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async create(travelId: string, dto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findByTravelAndName(travelId, dto.name);

    if (existing) {
      throw new ConflictError('A category with this name already exists in this travel');
    }

    return this.categoryRepository.create({
      travelId,
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      budgetLimit: dto.budgetLimit ?? null,
    });
  }

  async update(travelId: string, catId: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findByIdAndTravel(catId, travelId);

    if (!category) {
      throw new EntityNotFoundError('Category');
    }

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findByTravelAndName(travelId, dto.name);
      if (existing) {
        throw new ConflictError('A category with this name already exists in this travel');
      }
    }

    return this.categoryRepository.update(catId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...('budgetLimit' in dto && { budgetLimit: dto.budgetLimit ?? null }),
    });
  }

  async remove(travelId: string, catId: string) {
    const category = await this.categoryRepository.findByIdAndTravel(catId, travelId);

    if (!category) {
      throw new EntityNotFoundError('Category');
    }

    const expenseCount = await this.categoryRepository.countExpensesByCategory(catId);

    if (expenseCount > 0) {
      throw new ConflictError(
        'Cannot delete this category because it has associated expenses. Please reassign or delete the expenses first.',
      );
    }

    await this.categoryRepository.delete(catId);
  }
}
