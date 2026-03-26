import { describe, it, expect } from 'vitest';
import type { DashboardData, Expense } from '@repo/api-client';

import { computeTripInsights } from '@repo/core';

const mockOptions = {
  formatAmount: (amount: number) => `€${amount}`,
  formatDate: (dateStr: string) => dateStr,
  t: (key: string, opts?: Record<string, unknown>) => {
    if (key === 'summary.topSpender') return 'Top Spender';
    if (key === 'summary.biggestCategory') return 'Biggest Category';
    if (key === 'summary.biggestDay') return 'Biggest Day';
    if (key === 'summary.topSpenderDesc')
      return `${opts?.name} spent ${opts?.amount} (${opts?.percentage}% of total)`;
    if (key === 'summary.biggestCategoryDesc')
      return `${opts?.name} — ${opts?.amount} across spending`;
    if (key === 'summary.biggestDayDesc') return `${opts?.date} — ${opts?.amount} spent`;
    return key;
  },
};

const mockDashboard: DashboardData = {
  currency: 'EUR',
  overall: { budget: 3000, totalSpent: 2450, status: 'warning' },
  memberSpending: [
    { memberId: 'm1', displayName: 'Ricardo', totalSpent: 1380 },
    { memberId: 'm2', displayName: 'Ana', totalSpent: 620 },
    { memberId: 'm3', displayName: 'Carlos', totalSpent: 450 },
  ],
  categorySpending: [
    {
      categoryId: 'c1',
      name: 'Food & Drinks',
      icon: '🍔',
      color: '#FF6B35',
      totalSpent: 980,
      budgetLimit: 500,
      status: 'exceeded',
    },
    {
      categoryId: 'c2',
      name: 'Transport',
      icon: '🚗',
      color: '#0EA5E9',
      totalSpent: 420,
      budgetLimit: 400,
      status: 'exceeded',
    },
    {
      categoryId: 'c3',
      name: 'Activities',
      icon: '🎯',
      color: '#8B5CF6',
      totalSpent: 350,
      budgetLimit: 600,
      status: 'ok',
    },
  ],
};

const mockExpenses: Expense[] = [
  {
    id: 'e1',
    travelId: 't1',
    categoryId: 'c1',
    memberId: 'm1',
    amount: 120,
    description: 'Dinner',
    date: '2026-03-16',
    createdAt: '2026-03-16T19:00:00Z',
    updatedAt: '2026-03-16T19:00:00Z',
  },
  {
    id: 'e2',
    travelId: 't1',
    categoryId: 'c1',
    memberId: 'm1',
    amount: 80,
    description: 'Lunch',
    date: '2026-03-17',
    createdAt: '2026-03-17T12:00:00Z',
    updatedAt: '2026-03-17T12:00:00Z',
  },
  {
    id: 'e3',
    travelId: 't1',
    categoryId: 'c2',
    memberId: 'm2',
    amount: 50,
    description: 'Taxi',
    date: '2026-03-17',
    createdAt: '2026-03-17T15:00:00Z',
    updatedAt: '2026-03-17T15:00:00Z',
  },
  {
    id: 'e4',
    travelId: 't1',
    categoryId: 'c3',
    memberId: 'm1',
    amount: 200,
    description: 'Sintra day trip',
    date: '2026-03-18',
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 'e5',
    travelId: 't1',
    categoryId: 'c1',
    memberId: 'm3',
    amount: 350,
    description: 'Big dinner',
    date: '2026-03-18',
    createdAt: '2026-03-18T20:00:00Z',
    updatedAt: '2026-03-18T20:00:00Z',
  },
];

describe('computeTripInsights', () => {
  it('returns Top Spender with correct member name and amount', () => {
    const insights = computeTripInsights(mockDashboard, mockExpenses, mockOptions);
    const topSpender = insights.find((i) => i.type === 'topSpender');

    expect(topSpender).toBeDefined();
    expect(topSpender!.title).toBe('Top Spender');
    expect(topSpender!.description).toContain('Ricardo');
    expect(topSpender!.description).toContain('€1380');
    expect(topSpender!.description).toContain('56%');
  });

  it('returns Biggest Category with correct name', () => {
    const insights = computeTripInsights(mockDashboard, mockExpenses, mockOptions);
    const biggestCategory = insights.find((i) => i.type === 'biggestCategory');

    expect(biggestCategory).toBeDefined();
    expect(biggestCategory!.title).toBe('Biggest Category');
    expect(biggestCategory!.description).toContain('Food & Drinks');
    expect(biggestCategory!.description).toContain('€980');
  });

  it('returns Biggest Day with correct date and amount', () => {
    const insights = computeTripInsights(mockDashboard, mockExpenses, mockOptions);
    const biggestDay = insights.find((i) => i.type === 'biggestDay');

    expect(biggestDay).toBeDefined();
    expect(biggestDay!.title).toBe('Biggest Day');
    // Mar 18: 200 + 350 = 550
    expect(biggestDay!.description).toContain('2026-03-18');
    expect(biggestDay!.description).toContain('€550');
  });

  it('returns empty array when no expenses', () => {
    const insights = computeTripInsights(mockDashboard, [], mockOptions);
    expect(insights).toHaveLength(0);
  });

  it('handles single member', () => {
    const singleMemberDashboard: DashboardData = {
      ...mockDashboard,
      memberSpending: [{ memberId: 'm1', displayName: 'Solo Traveler', totalSpent: 1000 }],
    };
    const insights = computeTripInsights(singleMemberDashboard, mockExpenses, mockOptions);
    const topSpender = insights.find((i) => i.type === 'topSpender');

    expect(topSpender).toBeDefined();
    expect(topSpender!.description).toContain('Solo Traveler');
  });

  it('handles tied values (picks first one)', () => {
    const tiedDashboard: DashboardData = {
      ...mockDashboard,
      memberSpending: [
        { memberId: 'm1', displayName: 'Alice', totalSpent: 500 },
        { memberId: 'm2', displayName: 'Bob', totalSpent: 500 },
      ],
      overall: { budget: 3000, totalSpent: 1000, status: 'ok' },
    };
    const insights = computeTripInsights(tiedDashboard, mockExpenses, mockOptions);
    const topSpender = insights.find((i) => i.type === 'topSpender');

    expect(topSpender).toBeDefined();
    // Should pick Alice (first one)
    expect(topSpender!.description).toContain('Alice');
  });

  it('skips Biggest Category when all have zero spending', () => {
    const zeroDashboard: DashboardData = {
      ...mockDashboard,
      categorySpending: [
        {
          categoryId: 'c1',
          name: 'Food',
          icon: '🍔',
          color: '#FF6B35',
          totalSpent: 0,
          budgetLimit: 500,
          status: 'ok',
        },
      ],
    };
    const insights = computeTripInsights(zeroDashboard, mockExpenses, mockOptions);
    const biggestCategory = insights.find((i) => i.type === 'biggestCategory');
    expect(biggestCategory).toBeUndefined();
  });

  it('returns exactly 3 insights for normal data', () => {
    const insights = computeTripInsights(mockDashboard, mockExpenses, mockOptions);
    expect(insights).toHaveLength(3);
    expect(insights[0].type).toBe('topSpender');
    expect(insights[1].type).toBe('biggestCategory');
    expect(insights[2].type).toBe('biggestDay');
  });
});
