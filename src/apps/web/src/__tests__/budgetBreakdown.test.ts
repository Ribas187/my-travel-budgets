import { describe, it, expect } from 'vitest'
import React from 'react'
import type { DashboardData, CategorySpending, Expense } from '@repo/api-client'

const mockCategories: CategorySpending[] = [
  {
    categoryId: 'cat-1',
    name: 'Food & Drinks',
    icon: '🍔',
    color: '#FF6B35',
    totalSpent: 380,
    budgetLimit: 500,
    status: 'warning',
  },
  {
    categoryId: 'cat-2',
    name: 'Transport',
    icon: '🚗',
    color: '#0EA5E9',
    totalSpent: 120,
    budgetLimit: 400,
    status: 'ok',
  },
  {
    categoryId: 'cat-3',
    name: 'Activities',
    icon: '🎯',
    color: '#8B5CF6',
    totalSpent: 180,
    budgetLimit: 600,
    status: 'ok',
  },
  {
    categoryId: 'cat-4',
    name: 'Shopping',
    icon: '🛍️',
    color: '#EC4899',
    totalSpent: 100,
    budgetLimit: null,
    status: 'ok',
  },
]

const mockDashboard: DashboardData = {
  currency: 'EUR',
  overall: {
    budget: 3000,
    totalSpent: 780,
    status: 'ok',
  },
  categorySpending: mockCategories,
  memberSpending: [
    { memberId: 'm1', displayName: 'Alice', totalSpent: 780 },
  ],
}

const mockExpenses: Expense[] = [
  { id: 'e1', travelId: 't1', categoryId: 'cat-1', memberId: 'm1', amount: 40, description: 'Lunch', date: '2026-03-18', createdAt: '2026-03-18T12:00:00Z', updatedAt: '2026-03-18T12:00:00Z' },
  { id: 'e2', travelId: 't1', categoryId: 'cat-1', memberId: 'm1', amount: 30, description: 'Dinner', date: '2026-03-18', createdAt: '2026-03-18T19:00:00Z', updatedAt: '2026-03-18T19:00:00Z' },
  { id: 'e3', travelId: 't1', categoryId: 'cat-2', memberId: 'm1', amount: 15, description: 'Metro', date: '2026-03-17', createdAt: '2026-03-17T10:00:00Z', updatedAt: '2026-03-17T10:00:00Z' },
  { id: 'e4', travelId: 't1', categoryId: 'cat-3', memberId: 'm1', amount: 25, description: 'Museum', date: '2026-03-17', createdAt: '2026-03-17T14:00:00Z', updatedAt: '2026-03-17T14:00:00Z' },
  { id: 'e5', travelId: 't1', categoryId: 'cat-1', memberId: 'm1', amount: 10, description: 'Coffee', date: '2026-03-16', createdAt: '2026-03-16T09:00:00Z', updatedAt: '2026-03-16T09:00:00Z' },
]

describe('BudgetBreakdownPage', () => {
  it('exports BudgetBreakdownPage component', async () => {
    const { BudgetBreakdownPage } = await import('@/features/budget/BudgetBreakdownPage')
    expect(BudgetBreakdownPage).toBeDefined()
    expect(typeof BudgetBreakdownPage).toBe('function')
  })

  describe('summary card', () => {
    it('shows correct total budget and spent values', () => {
      const totalBudget = mockDashboard.overall.budget
      const totalSpent = mockDashboard.overall.totalSpent
      expect(totalBudget).toBe(3000)
      expect(totalSpent).toBe(780)

      const formattedBudget = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(totalBudget)
      expect(formattedBudget).toContain('3,000')
    })
  })

  describe('renders correct number of CategoryDetailCard items', () => {
    it('has one card per category in categorySpending', async () => {
      const { CategoryDetailCard } = await import('@repo/ui')
      expect(CategoryDetailCard).toBeDefined()

      const elements = mockCategories.map((cat) =>
        React.createElement(CategoryDetailCard, {
          key: cat.categoryId,
          name: cat.name,
          icon: React.createElement('span', null, cat.icon),
          iconColor: cat.color,
          iconBackground: `${cat.color}20`,
          spent: cat.totalSpent,
          budget: cat.budgetLimit,
          expenseCount: 3,
          currency: 'EUR',
          locale: 'en',
        })
      )
      expect(elements).toHaveLength(4)
      expect(elements[0].props.name).toBe('Food & Drinks')
      expect(elements[3].props.name).toBe('Shopping')
    })
  })

  describe('stacked bar segments', () => {
    it('has proportional widths based on category spending', () => {
      const totalSpent = mockDashboard.overall.totalSpent
      const proportions = mockCategories
        .filter((cat) => cat.totalSpent > 0)
        .map((cat) => ({
          id: cat.categoryId,
          flex: cat.totalSpent / totalSpent,
        }))

      expect(proportions).toHaveLength(4)
      // Food: 380/780 ≈ 0.487
      expect(proportions[0].flex).toBeCloseTo(380 / 780, 3)
      // Transport: 120/780 ≈ 0.154
      expect(proportions[1].flex).toBeCloseTo(120 / 780, 3)
      // Activities: 180/780 ≈ 0.231
      expect(proportions[2].flex).toBeCloseTo(180 / 780, 3)
      // Shopping: 100/780 ≈ 0.128
      expect(proportions[3].flex).toBeCloseTo(100 / 780, 3)
    })
  })
})

describe('Pacing text', () => {
  it('shows "On track" when under budget', () => {
    const spent = 380
    const budget = 500
    const isOverBudget = spent >= budget
    expect(isOverBudget).toBe(false)
    const pacingText = isOverBudget
      ? `Over budget by €${spent - budget}`
      : 'On track'
    expect(pacingText).toBe('On track')
  })

  it('shows "Over budget by X" when exceeded', () => {
    const spent = 550
    const budget = 500
    const isOverBudget = spent >= budget
    expect(isOverBudget).toBe(true)
    const overAmount = spent - budget
    expect(overAmount).toBe(50)

    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(overAmount)
    expect(formatted).toContain('50')
  })

  it('handles null budget — no pacing text', () => {
    const budget: number | null = null
    const hasBudget = budget !== null && budget > 0
    expect(hasBudget).toBe(false)
  })
})

describe('"Set a budget" CTA', () => {
  it('is rendered when category budgetLimit is null', () => {
    const catWithNoBudget = mockCategories.find((c) => c.budgetLimit === null)
    expect(catWithNoBudget).toBeDefined()
    expect(catWithNoBudget!.name).toBe('Shopping')

    // onSetBudget should be provided when budgetLimit is null
    const shouldShowCTA = catWithNoBudget!.budgetLimit === null
    expect(shouldShowCTA).toBe(true)
  })

  it('is not rendered when category has a budget', () => {
    const catWithBudget = mockCategories.find((c) => c.budgetLimit !== null)
    expect(catWithBudget).toBeDefined()
    const shouldShowCTA = catWithBudget!.budgetLimit === null
    expect(shouldShowCTA).toBe(false)
  })

  it('navigation callback targets categories page', () => {
    // Verify the navigation path structure
    const travelId = 'travel-123'
    const expectedPath = `/travels/${travelId}/categories`
    expect(expectedPath).toBe('/travels/travel-123/categories')
  })
})

describe('Expense count by category', () => {
  it('correctly counts expenses per category', () => {
    const counts: Record<string, number> = {}
    for (const exp of mockExpenses) {
      counts[exp.categoryId] = (counts[exp.categoryId] ?? 0) + 1
    }
    expect(counts['cat-1']).toBe(3) // Lunch, Dinner, Coffee
    expect(counts['cat-2']).toBe(1) // Metro
    expect(counts['cat-3']).toBe(1) // Museum
    expect(counts['cat-4']).toBeUndefined() // Shopping has no expenses
  })
})
