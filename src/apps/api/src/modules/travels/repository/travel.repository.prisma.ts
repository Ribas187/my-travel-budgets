import { Injectable } from '@nestjs/common';
import type { Travel } from '@prisma/client';

import type { CreateTravelDto } from '../dto/create-travel.dto';

import type { ITravelRepository, TravelWithDetails } from './travel.repository.interface';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PrismaTravelRepository implements ITravelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwner(userId: string, dto: CreateTravelDto): Promise<Travel> {
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

  findAllByUser(userId: string): Promise<Travel[]> {
    return this.prisma.travel.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  findOneWithDetails(travelId: string): Promise<TravelWithDetails | null> {
    return this.prisma.travel.findUnique({
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
    }) as Promise<TravelWithDetails | null>;
  }

  async getTotalSpent(travelId: string): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      where: { travelId },
      _sum: { amount: true },
    });

    return result._sum.amount?.toNumber() ?? 0;
  }

  update(travelId: string, data: Record<string, unknown>): Promise<Travel> {
    return this.prisma.travel.update({
      where: { id: travelId },
      data,
    });
  }

  async remove(travelId: string): Promise<void> {
    await this.prisma.travel.delete({
      where: { id: travelId },
    });
  }
}
