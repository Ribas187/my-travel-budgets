import type { DashboardData, Expense } from '@repo/api-client'
import type { ReactNode } from 'react'

export interface TripInsight {
  type: 'topSpender' | 'biggestCategory' | 'biggestDay'
  title: string
  description: string
  icon: string
  iconBackground: string
}

interface InsightOptions {
  formatAmount: (amount: number) => string
  formatDate: (dateStr: string) => string
  t: (key: string, opts?: Record<string, unknown>) => string
}

export function computeTripInsights(
  dashboard: DashboardData,
  expenses: Expense[],
  options: InsightOptions,
): TripInsight[] {
  const { formatAmount, formatDate, t } = options
  const insights: TripInsight[] = []

  if (expenses.length === 0) return insights

  // Top Spender
  if (dashboard.memberSpending.length > 0) {
    const topSpender = dashboard.memberSpending.reduce((top, ms) =>
      ms.totalSpent > top.totalSpent ? ms : top,
    )
    const totalSpent = dashboard.overall.totalSpent
    const percentage = totalSpent > 0
      ? Math.round((topSpender.totalSpent / totalSpent) * 100)
      : 0

    insights.push({
      type: 'topSpender',
      title: t('summary.topSpender'),
      description: t('summary.topSpenderDesc', {
        name: topSpender.displayName,
        amount: formatAmount(topSpender.totalSpent),
        percentage,
      }),
      icon: '👤',
      iconBackground: '#0D948820',
    })
  }

  // Biggest Category
  const categoriesWithSpending = dashboard.categorySpending.filter(
    (cs) => cs.totalSpent > 0,
  )
  if (categoriesWithSpending.length > 0) {
    const biggestCategory = categoriesWithSpending.reduce((top, cs) =>
      cs.totalSpent > top.totalSpent ? cs : top,
    )

    insights.push({
      type: 'biggestCategory',
      title: t('summary.biggestCategory'),
      description: t('summary.biggestCategoryDesc', {
        name: biggestCategory.name,
        amount: formatAmount(biggestCategory.totalSpent),
      }),
      icon: biggestCategory.icon,
      iconBackground: `${biggestCategory.color}20`,
    })
  }

  // Biggest Day
  const dayTotals = new Map<string, number>()
  for (const exp of expenses) {
    const day = exp.date
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + exp.amount)
  }

  if (dayTotals.size > 0) {
    let biggestDay = ''
    let biggestDayAmount = 0
    for (const [day, total] of dayTotals) {
      if (total > biggestDayAmount) {
        biggestDay = day
        biggestDayAmount = total
      }
    }

    insights.push({
      type: 'biggestDay',
      title: t('summary.biggestDay'),
      description: t('summary.biggestDayDesc', {
        date: formatDate(biggestDay),
        amount: formatAmount(biggestDayAmount),
      }),
      icon: '📅',
      iconBackground: '#F59E0B20',
    })
  }

  return insights
}
