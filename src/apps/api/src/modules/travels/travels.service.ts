import { Injectable, NotFoundException } from '@nestjs/common';

import type { CreateTravelDto } from './dto/create-travel.dto';
import type { UpdateTravelDto } from './dto/update-travel.dto';

import type { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class TravelsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTravel(userId: string, dto: CreateTravelDto) {
    return this.prisma.$transaction(async (tx) => {
      const travel = await tx.travel.create({
        data: {
          name: dto.name,
          description: dto.description,
          imageUrl: dto.imageUrl,
          currency: dto.currency,
          budget: dto.budget,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          createdById: userId,
        },
      });

      await tx.travelMember.create({
        data: {
          travelId: travel.id,
          userId,
          role: 'owner',
        },
      });

      return travel;
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.travel.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(travelId: string) {
    const travel = await this.prisma.travel.findUnique({
      where: { id: travelId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        categories: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!travel) {
      throw new NotFoundException('Travel not found');
    }

    const result = await this.prisma.expense.aggregate({
      where: { travelId },
      _sum: { amount: true },
    });

    const totalSpent = result._sum.amount?.toNumber() ?? 0;

    return {
      ...travel,
      budget: travel.budget.toNumber(),
      categories: travel.categories.map((c) => ({
        ...c,
        budgetLimit: c.budgetLimit?.toNumber() ?? null,
      })),
      summary: {
        totalSpent,
        budget: travel.budget.toNumber(),
        remaining: travel.budget.toNumber() - totalSpent,
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

    return this.prisma.travel.update({
      where: { id: travelId },
      data,
    });
  }

  async remove(travelId: string) {
    await this.prisma.travel.delete({
      where: { id: travelId },
    });
  }
}
