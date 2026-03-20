import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import type { CategorySpending } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export type BudgetImpactLevel = 'none' | 'warning' | 'danger'

export interface BudgetImpact {
  level: BudgetImpactLevel
  percentageAfter: number
  categoryName: string
}

export function useBudgetImpact(
  travelId: string,
  categoryId: string | undefined,
  amount: number,
) {
  const { data: dashboard } = useQuery({
    queryKey: queryKeys.dashboard.get(travelId),
    queryFn: () => apiClient.dashboard.get(travelId),
    enabled: !!travelId,
  })

  if (!categoryId || !dashboard || amount <= 0) {
    return { level: 'none' as const, percentageAfter: 0, categoryName: '' }
  }

  const category: CategorySpending | undefined = dashboard.categorySpending.find(
    (c) => c.categoryId === categoryId,
  )

  if (!category || !category.budgetLimit || category.budgetLimit <= 0) {
    return { level: 'none' as const, percentageAfter: 0, categoryName: category?.name ?? '' }
  }

  const totalAfter = category.totalSpent + amount
  const percentageAfter = Math.round((totalAfter / category.budgetLimit) * 100)

  let level: BudgetImpactLevel = 'none'
  if (percentageAfter >= 100) {
    level = 'danger'
  } else if (percentageAfter >= 70) {
    level = 'warning'
  }

  return { level, percentageAfter, categoryName: category.name }
}
