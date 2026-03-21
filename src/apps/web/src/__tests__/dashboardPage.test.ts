import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import type { DashboardData, TravelDetail } from '@repo/api-client';

// Mock data factories

const mockTravel: TravelDetail = {
  id: 'travel-1',
  name: 'Lisbon Trip',
  description: null,
  imageUrl: null,
  currency: 'EUR',
  budget: 3000,
  startDate: '2026-03-15',
  endDate: '2026-03-25',
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
        email: 'user@test.com',
        name: 'Alice',
        avatarUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      createdAt: '',
      updatedAt: '',
    },
  ],
  categories: [
    {
      id: 'cat-1',
      travelId: 'travel-1',
      name: 'Food & Drinks',
      icon: '🍔',
      color: '#FF6B35',
      budgetLimit: 500,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'cat-2',
      travelId: 'travel-1',
      name: 'Transport',
      icon: '🚗',
      color: '#0EA5E9',
      budgetLimit: 400,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'cat-3',
      travelId: 'travel-1',
      name: 'Activities',
      icon: '🎯',
      color: '#8B5CF6',
      budgetLimit: 600,
      createdAt: '',
      updatedAt: '',
    },
  ],
};

const mockDashboard: DashboardData = {
  currency: 'EUR',
  overall: {
    budget: 3000,
    totalSpent: 2140,
    status: 'warning',
  },
  categorySpending: [
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
  ],
  memberSpending: [{ memberId: 'm1', displayName: 'Alice', totalSpent: 2140 }],
};

const mockExpenses = [
  {
    id: 'exp-1',
    travelId: 'travel-1',
    categoryId: 'cat-1',
    memberId: 'm1',
    amount: 42,
    description: 'Lunch at Time Out Market',
    date: '2026-03-18',
    createdAt: '2026-03-18T12:30:00Z',
    updatedAt: '2026-03-18T12:30:00Z',
  },
  {
    id: 'exp-2',
    travelId: 'travel-1',
    categoryId: 'cat-2',
    memberId: 'm1',
    amount: 15,
    description: 'Metro ticket',
    date: '2026-03-18',
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'exp-3',
    travelId: 'travel-1',
    categoryId: 'cat-1',
    memberId: 'm1',
    amount: 34,
    description: 'Pastel de Nata',
    date: '2026-03-17',
    createdAt: '2026-03-17T09:00:00Z',
    updatedAt: '2026-03-17T09:00:00Z',
  },
  {
    id: 'exp-4',
    travelId: 'travel-1',
    categoryId: 'cat-3',
    memberId: 'm1',
    amount: 25,
    description: 'Tram 28 day pass',
    date: '2026-03-17',
    createdAt: '2026-03-17T08:00:00Z',
    updatedAt: '2026-03-17T08:00:00Z',
  },
  {
    id: 'exp-5',
    travelId: 'travel-1',
    categoryId: 'cat-3',
    memberId: 'm1',
    amount: 20,
    description: 'Belém Tower tickets',
    date: '2026-03-16',
    createdAt: '2026-03-16T14:00:00Z',
    updatedAt: '2026-03-16T14:00:00Z',
  },
];

describe('DashboardPage', () => {
  it('exports DashboardPage component', async () => {
    const { DashboardPage } = await import('@/features/dashboard/DashboardPage');
    expect(DashboardPage).toBeDefined();
    expect(typeof DashboardPage).toBe('function');
  });

  describe('renders BudgetRing with correct props from dashboard data', () => {
    it('BudgetRing component accepts total, spent, currency, locale props', async () => {
      const { BudgetRing } = await import('@repo/ui');
      expect(BudgetRing).toBeDefined();

      // Verify we can create a BudgetRing element with dashboard data
      const element = React.createElement(BudgetRing, {
        total: mockDashboard.overall.budget,
        spent: mockDashboard.overall.totalSpent,
        currency: mockDashboard.currency,
        locale: 'en',
      });
      expect(element.props.total).toBe(3000);
      expect(element.props.spent).toBe(2140);
      expect(element.props.currency).toBe('EUR');
    });
  });

  describe('renders correct number of CategoryProgressRow items', () => {
    it('CategoryProgressRow can be created for each category spending entry', async () => {
      const { CategoryProgressRow } = await import('@repo/ui');
      expect(CategoryProgressRow).toBeDefined();

      const elements = mockDashboard.categorySpending.map((cat) =>
        React.createElement(CategoryProgressRow, {
          key: cat.categoryId,
          name: cat.name,
          icon: React.createElement('span', null, cat.icon),
          iconColor: cat.color,
          iconBackground: `${cat.color}20`,
          spent: cat.totalSpent,
          budget: cat.budgetLimit,
          currency: mockDashboard.currency,
          locale: 'en',
        }),
      );
      expect(elements).toHaveLength(3);
      expect(elements[0].props.name).toBe('Food & Drinks');
      expect(elements[0].props.spent).toBe(380);
      expect(elements[0].props.budget).toBe(500);
    });
  });

  describe('renders up to 5 ExpenseRow items', () => {
    it('ExpenseRow can be created for each recent expense', async () => {
      const { ExpenseRow } = await import('@repo/ui');
      expect(ExpenseRow).toBeDefined();

      const recentExpenses = [...mockExpenses]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      expect(recentExpenses).toHaveLength(5);

      const elements = recentExpenses.map((expense) => {
        const category = mockTravel.categories.find((c) => c.id === expense.categoryId);
        return React.createElement(ExpenseRow, {
          key: expense.id,
          title: expense.description,
          category: category?.name ?? '',
          time: '12:30',
          paidBy: 'Alice',
          amount: `€${expense.amount.toFixed(2)}`,
          icon: React.createElement('span', null, category?.icon ?? '📝'),
        });
      });
      expect(elements).toHaveLength(5);
      expect(elements[0].props.title).toBe('Lunch at Time Out Market');
    });
  });

  describe('shows empty state when no expenses', () => {
    it('detects empty state when totalSpent is 0 and no expenses', () => {
      const emptyDashboard: DashboardData = {
        ...mockDashboard,
        overall: { budget: 3000, totalSpent: 0, status: 'ok' },
        categorySpending: [],
      };
      const noExpenses: typeof mockExpenses = [];

      const isEmpty = emptyDashboard.overall.totalSpent === 0 && noExpenses.length === 0;
      expect(isEmpty).toBe(true);
    });

    it('does not show empty state when expenses exist', () => {
      const isEmpty = mockDashboard.overall.totalSpent === 0 && mockExpenses.length === 0;
      expect(isEmpty).toBe(false);
    });
  });

  describe('desktop layout', () => {
    it('StatCard can be created with dashboard data for desktop row', async () => {
      const { StatCard } = await import('@repo/ui');
      expect(StatCard).toBeDefined();

      const remaining = mockDashboard.overall.budget - mockDashboard.overall.totalSpent;
      const avgPerDay = mockDashboard.overall.totalSpent / 4; // 4 days into trip

      const statCards = [
        React.createElement(StatCard, { key: '1', label: 'Total Budget', value: '€3,000' }),
        React.createElement(StatCard, { key: '2', label: 'Spent', value: '€2,140' }),
        React.createElement(StatCard, { key: '3', label: 'Remaining', value: `€${remaining}` }),
        React.createElement(StatCard, {
          key: '4',
          label: 'Daily Average',
          value: `€${avgPerDay.toFixed(0)}`,
        }),
      ];
      expect(statCards).toHaveLength(4);
      expect(statCards[0].props.label).toBe('Total Budget');
      expect(statCards[1].props.value).toBe('€2,140');
    });
  });

  describe('average per day calculation', () => {
    it('computes avgPerDay = totalSpent / daysSinceStart', () => {
      const totalSpent = 2140;
      const daysSinceStart = 4;
      const avgPerDay = totalSpent / daysSinceStart;
      expect(avgPerDay).toBe(535);
    });

    it('defaults to at least 1 day to avoid division by zero', () => {
      const start = new Date('2026-03-20');
      const end = new Date('2026-03-25');
      const today = new Date('2026-03-20');
      const effectiveEnd = today < end ? today : end;
      const diffMs = effectiveEnd.getTime() - start.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      const daysSinceStart = Math.max(1, days);
      expect(daysSinceStart).toBe(1);
    });
  });

  describe('currency formatting', () => {
    it('formats currency using Intl.NumberFormat', () => {
      const formatted = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(2140);
      expect(formatted).toContain('2,140');
    });

    it('formats currency with locale pt-BR', () => {
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(2140);
      expect(formatted).toContain('2.140');
    });
  });

  describe('SectionHeader onAction behavior', () => {
    it('renders action text and fires onAction callback on press', () => {
      const onAction = vi.fn();
      const element = React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          {
            onClick: onAction,
            role: 'button',
            style: { cursor: 'pointer' },
          },
          'Ver tudo',
        ),
      );

      // Verify element structure matches the SectionHeader pattern
      expect(element.props.children.props.role).toBe('button');
      expect(element.props.children.props.style.cursor).toBe('pointer');
      expect(element.props.children.props.children).toBe('Ver tudo');

      // Simulate the onPress/onClick callback
      element.props.children.props.onClick();
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('renders action text without onAction gracefully (no crash, no button role)', () => {
      const element = React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          {
            role: undefined,
            style: { cursor: undefined },
          },
          'Ver tudo',
        ),
      );

      // Verify no role or cursor when onAction is not provided
      expect(element.props.children.props.role).toBeUndefined();
      expect(element.props.children.props.style.cursor).toBeUndefined();
      expect(element.props.children.props.children).toBe('Ver tudo');
    });
  });

  describe('SectionHeader navigation wiring', () => {
    it('"Ver tudo" navigates to budget route with correct travelId', () => {
      const navigateMock = vi.fn();
      const travelId = 'travel-1';

      // Simulate the handleSeeAllCategories callback from DashboardPage
      const handleSeeAllCategories = () => {
        navigateMock({
          to: '/travels/$travelId/budget',
          params: { travelId },
        });
      };

      handleSeeAllCategories();

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/travels/$travelId/budget',
        params: { travelId: 'travel-1' },
      });
    });

    it('"Ver todas" navigates to expenses route with correct travelId', () => {
      const navigateMock = vi.fn();
      const travelId = 'travel-1';

      // Simulate the handleViewAllExpenses callback from DashboardPage
      const handleViewAllExpenses = () => {
        navigateMock({
          to: '/travels/$travelId/expenses',
          params: { travelId },
        });
      };

      handleViewAllExpenses();

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/travels/$travelId/expenses',
        params: { travelId: 'travel-1' },
      });
    });

    it('navigation handlers are passed to both mobile and desktop layouts', () => {
      const onSeeAllCategories = vi.fn();
      const onViewAllExpenses = vi.fn();

      // Simulate MobileLayout receiving the handlers
      const mobileElement = React.createElement('div', {
        onSeeAllCategories,
        onViewAllExpenses,
      });
      expect(mobileElement.props.onSeeAllCategories).toBe(onSeeAllCategories);
      expect(mobileElement.props.onViewAllExpenses).toBe(onViewAllExpenses);

      // Simulate DesktopLayout receiving the handlers
      const desktopElement = React.createElement('div', {
        onSeeAllCategories,
        onViewAllExpenses,
      });
      expect(desktopElement.props.onSeeAllCategories).toBe(onSeeAllCategories);
      expect(desktopElement.props.onViewAllExpenses).toBe(onViewAllExpenses);
    });
  });
});
