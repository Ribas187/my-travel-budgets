import { Inject, Injectable } from '@nestjs/common';

import type { CreateTravelDto } from './dto/create-travel.dto';
import type { UpdateTravelDto } from './dto/update-travel.dto';
import type { ITravelRepository } from './repository/travel.repository.interface';

import { TRAVEL_REPOSITORY } from '@/modules/common/database';
import { EntityNotFoundError } from '@/modules/common/exceptions';

@Injectable()
export class TravelsService {
  constructor(
    @Inject(TRAVEL_REPOSITORY)
    private readonly travelRepository: ITravelRepository,
  ) {}

  async createTravel(userId: string, dto: CreateTravelDto) {
    return this.travelRepository.createWithOwner(userId, dto);
  }

  async findAllByUser(userId: string) {
    return this.travelRepository.findAllByUser(userId);
  }

  async findOne(travelId: string) {
    const travel = await this.travelRepository.findOneWithDetails(travelId);

    if (!travel) {
      throw new EntityNotFoundError('Travel');
    }

    const totalSpent = await this.travelRepository.getTotalSpent(travelId);
    const budget = Number(travel.budget);

    return {
      ...travel,
      budget,
      categories: travel.categories.map((c) => ({
        ...c,
        budgetLimit: c.budgetLimit != null ? Number(c.budgetLimit) : null,
      })),
      summary: {
        totalSpent,
        budget,
        remaining: budget - totalSpent,
      },
    };
  }

  async update(travelId: string, dto: UpdateTravelDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.budget !== undefined) data.budget = dto.budget;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    return this.travelRepository.update(travelId, data);
  }

  async remove(travelId: string) {
    await this.travelRepository.remove(travelId);
  }
}
