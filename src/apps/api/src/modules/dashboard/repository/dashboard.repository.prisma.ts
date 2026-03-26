import { Injectable } from '@nestjs/common';

import type {
  IDashboardRepository,
  DashboardTravelData,
  MemberSpendingRow,
  CategorySpendingRow,
} from './dashboard.repository.interface';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PrismaDashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTravelWithMembersAndCategories(
    travelId: string,
  ): Promise<DashboardTravelData | null> {
    const travel = await this.prisma.travel.findUnique({
      where: { id: travelId },
      include: {
        members: { include: { user: true } },
        categories: true,
      },
    });

    if (!travel) return null;

    return {
      id: travel.id,
      currency: travel.currency,
      budget: Number(travel.budget),
      members: travel.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        guestName: m.guestName,
        user: m.user ? { name: m.user.name } : null,
      })),
      categories: travel.categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : null,
      })),
    };
  }

  async getSpendingByMember(travelId: string): Promise<MemberSpendingRow[]> {
    const results = await this.prisma.expense.groupBy({
      by: ['memberId'],
      where: { travelId },
      _sum: { amount: true },
    });

    return results
      .filter((entry) => entry.memberId !== null)
      .map((entry) => ({
        memberId: entry.memberId!,
        totalSpent: Number(entry._sum.amount ?? 0),
      }));
  }

  async getSpendingByCategory(travelId: string): Promise<CategorySpendingRow[]> {
    const results = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { travelId },
      _sum: { amount: true },
    });

    return results.map((entry) => ({
      categoryId: entry.categoryId,
      totalSpent: Number(entry._sum.amount ?? 0),
    }));
  }
}
