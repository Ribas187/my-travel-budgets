import { Inject, Injectable } from '@nestjs/common';

import type {
  DashboardResponse,
  MemberSpendingItem,
  CategorySpendingItem,
} from './dashboard.types';
import { computeAlertStatus } from './dashboard.types';
import type { IDashboardRepository } from './repository/dashboard.repository.interface';

import { DASHBOARD_REPOSITORY } from '@/modules/common/database';
import { EntityNotFoundError } from '@/modules/common/exceptions';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
  ) {}

  async getDashboard(travelId: string): Promise<DashboardResponse> {
    const [travelData, memberSums, categorySums] = await Promise.all([
      this.dashboardRepository.getTravelWithMembersAndCategories(travelId),
      this.dashboardRepository.getSpendingByMember(travelId),
      this.dashboardRepository.getSpendingByCategory(travelId),
    ]);

    if (!travelData) {
      throw new EntityNotFoundError('Travel');
    }

    const memberSpendingMap = new Map<string, number>();
    for (const entry of memberSums) {
      memberSpendingMap.set(entry.memberId, entry.totalSpent);
    }

    const categorySpendingMap = new Map<string, number>();
    for (const entry of categorySums) {
      categorySpendingMap.set(entry.categoryId, entry.totalSpent);
    }

    const memberSpending: MemberSpendingItem[] = travelData.members.map((member) => ({
      memberId: member.id,
      displayName: member.user?.name ?? member.guestName ?? '',
      totalSpent: memberSpendingMap.get(member.id) ?? 0,
    }));

    const categorySpending: CategorySpendingItem[] = travelData.categories.map((category) => {
      const totalSpent = categorySpendingMap.get(category.id) ?? 0;
      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        totalSpent,
        budgetLimit: category.budgetLimit,
        status: computeAlertStatus(totalSpent, category.budgetLimit),
      };
    });

    const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.totalSpent, 0);

    return {
      currency: travelData.currency,
      overall: {
        budget: travelData.budget,
        totalSpent,
        status: computeAlertStatus(totalSpent, travelData.budget),
      },
      memberSpending,
      categorySpending,
    };
  }
}
