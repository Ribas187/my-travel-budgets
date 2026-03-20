import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/modules/prisma/prisma.service'
import type {
  DashboardResponse,
  MemberSpendingItem,
  CategorySpendingItem,
} from './dashboard.types'
import { computeAlertStatus } from './dashboard.types'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(travelId: string): Promise<DashboardResponse> {
    const [travelData, memberSums, categorySums] = await Promise.all([
      this.prisma.travel.findUnique({
        where: { id: travelId },
        include: {
          members: { include: { user: true } },
          categories: true,
        },
      }),
      this.prisma.expense.groupBy({
        by: ['memberId'],
        where: { travelId },
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: { travelId },
        _sum: { amount: true },
      }),
    ])

    if (!travelData) {
      throw new NotFoundException('Travel not found')
    }

    const memberSpendingMap = new Map<string, number>()
    for (const entry of memberSums) {
      if (entry.memberId) {
        memberSpendingMap.set(
          entry.memberId,
          Number(entry._sum.amount ?? 0),
        )
      }
    }

    const categorySpendingMap = new Map<string, number>()
    for (const entry of categorySums) {
      categorySpendingMap.set(
        entry.categoryId,
        Number(entry._sum.amount ?? 0),
      )
    }

    const memberSpending: MemberSpendingItem[] = travelData.members.map(
      (member) => ({
        memberId: member.id,
        displayName: member.user?.name ?? member.guestName ?? '',
        totalSpent: memberSpendingMap.get(member.id) ?? 0,
      }),
    )

    const categorySpending: CategorySpendingItem[] =
      travelData.categories.map((category) => {
        const totalSpent = categorySpendingMap.get(category.id) ?? 0
        const budgetLimit = category.budgetLimit
          ? Number(category.budgetLimit)
          : null
        return {
          categoryId: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          totalSpent,
          budgetLimit,
          status: computeAlertStatus(totalSpent, budgetLimit),
        }
      })

    const totalSpent = categorySpending.reduce(
      (sum, cat) => sum + cat.totalSpent,
      0,
    )
    const budget = Number(travelData.budget)

    return {
      currency: travelData.currency,
      overall: {
        budget,
        totalSpent,
        status: computeAlertStatus(totalSpent, budget),
      },
      memberSpending,
      categorySpending,
    }
  }
}
