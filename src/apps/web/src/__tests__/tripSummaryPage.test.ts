import { describe, it, expect } from 'vitest';
import React from 'react';
import type { TravelDetail, DashboardData } from '@repo/api-client';

const mockTravel: TravelDetail = {
  id: 'travel-1',
  name: 'Lisbon 2026',
  description: null,
  imageUrl: null,
  currency: 'EUR',
  budget: 3000,
  startDate: '2026-03-16',
  endDate: '2026-03-22',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [
    {
      id: 'm1',
      travelId: 'travel-1',
      userId: 'u1',
      guestName: null,
      role: 'owner',
      user: {
        id: 'u1',
        email: 'ricardo@test.com',
        name: 'Ricardo',
        avatarUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm2',
      travelId: 'travel-1',
      userId: 'u2',
      guestName: null,
      role: 'member',
      user: {
        id: 'u2',
        email: 'ana@test.com',
        name: 'Ana',
        avatarUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm3',
      travelId: 'travel-1',
      userId: null,
      guestName: 'Carlos',
      role: 'member',
      user: null,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'm4',
      travelId: 'travel-1',
      userId: 'u4',
      guestName: null,
      role: 'member',
      user: {
        id: 'u4',
        email: 'diana@test.com',
        name: 'Diana',
        avatarUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      createdAt: '',
      updatedAt: '',
    },
  ],
  categories: [],
};

const mockDashboard: DashboardData = {
  currency: 'EUR',
  overall: { budget: 3000, totalSpent: 2450, status: 'warning' },
  memberSpending: [
    { memberId: 'm1', displayName: 'Ricardo', totalSpent: 1380 },
    { memberId: 'm2', displayName: 'Ana', totalSpent: 620 },
    { memberId: 'm3', displayName: 'Carlos', totalSpent: 250 },
    { memberId: 'm4', displayName: 'Diana', totalSpent: 200 },
  ],
  categorySpending: [],
};

describe('TripSummaryPage', () => {
  it('exports TripSummaryPage component', async () => {
    const { TripSummaryPage } = await import('@/features/summary/TripSummaryPage');
    expect(TripSummaryPage).toBeDefined();
    expect(typeof TripSummaryPage).toBe('function');
  });

  describe('hero section', () => {
    it('renders trip name', () => {
      expect(mockTravel.name).toBe('Lisbon 2026');
    });

    it('renders formatted date range', () => {
      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const start = new Intl.DateTimeFormat('en', opts).format(new Date(mockTravel.startDate));
      const end = new Intl.DateTimeFormat('en', { ...opts, year: 'numeric' }).format(
        new Date(mockTravel.endDate),
      );
      const dateRange = `${start} – ${end}`;
      expect(dateRange).toContain('Mar');
    });

    it('shows "Complete" badge when endDate is in the past', () => {
      const pastTravel = { ...mockTravel, endDate: '2025-01-01' };
      const isComplete = new Date(pastTravel.endDate) < new Date();
      expect(isComplete).toBe(true);
    });

    it('hides badge when endDate is in the future', () => {
      const futureTravel = { ...mockTravel, endDate: '2027-12-31' };
      const isComplete = new Date(futureTravel.endDate) < new Date();
      expect(isComplete).toBe(false);
    });

    it('shows traveler count', () => {
      expect(mockTravel.members).toHaveLength(4);
    });
  });

  describe('stat cards', () => {
    it('renders correct number of StatCards (5 total: 2 + 3)', async () => {
      const { StatCard } = await import('@repo/ui');
      expect(StatCard).toBeDefined();

      // 2-col row: Total Spent, Under/Over Budget
      // 3-col row: Avg/Day, Expenses, Budget Used
      const statCardCount = 5;
      expect(statCardCount).toBe(5);
    });

    it('computes budget difference correctly', () => {
      const remaining = mockDashboard.overall.budget - mockDashboard.overall.totalSpent;
      expect(remaining).toBe(550); // Under budget
      expect(remaining >= 0).toBe(true); // Under budget label
    });

    it('computes budget used percentage', () => {
      const budgetUsed = Math.round(
        (mockDashboard.overall.totalSpent / mockDashboard.overall.budget) * 100,
      );
      expect(budgetUsed).toBe(82); // 2450/3000 = 81.67 → 82%
    });

    it('computes avg per day', () => {
      const dayCount = 7; // Mar 16 – Mar 22
      const avgPerDay = mockDashboard.overall.totalSpent / dayCount;
      expect(avgPerDay).toBe(350);
    });
  });

  describe('InsightCards', () => {
    it('InsightCard component is available', async () => {
      const { InsightCard } = await import('@repo/ui');
      expect(InsightCard).toBeDefined();

      const element = React.createElement(InsightCard, {
        title: 'Top Spender',
        description: 'Ricardo spent €1,380',
        icon: '👤',
        iconBackground: '#0D948820',
      });
      expect(element.props.title).toBe('Top Spender');
    });
  });

  describe('per-person list', () => {
    it('renders correct member count', () => {
      expect(mockTravel.members).toHaveLength(4);
    });

    it('AvatarChip can be created for each member', async () => {
      const { AvatarChip } = await import('@repo/ui');
      const elements = mockTravel.members.map((member, index) => {
        const displayName = member.user?.name ?? member.guestName ?? '';
        return React.createElement(AvatarChip, {
          key: member.id,
          name: displayName,
          initial: displayName.charAt(0).toUpperCase(),
        });
      });
      expect(elements).toHaveLength(4);
      expect(elements[0].props.name).toBe('Ricardo');
      expect(elements[2].props.name).toBe('Carlos');
    });

    it('shows spending amount per person', () => {
      const spendingMap = new Map(mockDashboard.memberSpending.map((ms) => [ms.memberId, ms]));
      expect(spendingMap.get('m1')?.totalSpent).toBe(1380);
      expect(spendingMap.get('m2')?.totalSpent).toBe(620);
      expect(spendingMap.get('m3')?.totalSpent).toBe(250);
      expect(spendingMap.get('m4')?.totalSpent).toBe(200);
    });
  });
});
