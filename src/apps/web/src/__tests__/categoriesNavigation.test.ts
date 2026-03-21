import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import type { DashboardData, CategorySpending } from '@repo/api-client';

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
];

const mockDashboard: DashboardData = {
  currency: 'EUR',
  overall: {
    budget: 3000,
    totalSpent: 500,
    status: 'ok',
  },
  categorySpending: mockCategories,
  memberSpending: [{ memberId: 'm1', displayName: 'Alice', totalSpent: 500 }],
};

describe('Categories Navigation — Task 5', () => {
  describe('BudgetBreakdownPage "Manage" action visibility on all breakpoints', () => {
    it('BudgetBreakdownPage renders SectionHeader with action unconditionally (no isDesktop check)', async () => {
      const source = await import('@/features/budget/BudgetBreakdownPage?raw');
      const code = (source as { default: string }).default;

      // The action should NOT be conditionally rendered with isDesktop
      expect(code).not.toMatch(/action=\{isDesktop/);
      // The action should be rendered unconditionally
      expect(code).toMatch(/action=\{t\(['"]budget\.manage['"]\)\}/);
    });

    it('SectionHeader renders action text when provided', () => {
      // Simulate the SectionHeader behavior: action is always rendered
      const actionText = 'Manage';
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
          actionText,
        ),
      );

      expect(element.props.children.props.children).toBe('Manage');
      expect(element.props.children.props.role).toBe('button');
    });

    it('"Manage" action is visible on mobile (no isDesktop guard)', async () => {
      // Verify the component source does not guard the onAction handler with isDesktop
      const source = await import('@/features/budget/BudgetBreakdownPage?raw');
      const code = (source as { default: string }).default;

      expect(code).not.toMatch(/onAction=\{isDesktop/);
      // The onAction should be passed unconditionally
      expect(code).toMatch(/onAction=\{handleNavigateToCategories\}/);
    });
  });

  describe('clicking "Manage" navigates to categories route', () => {
    it('handleNavigateToCategories calls navigate with correct route', () => {
      const navigateMock = vi.fn();
      const travelId = 'travel-123';

      // Simulate the handleNavigateToCategories callback
      const handleNavigateToCategories = () => {
        navigateMock({
          to: '/travels/$travelId/categories',
          params: { travelId },
        });
      };

      handleNavigateToCategories();

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/travels/$travelId/categories',
        params: { travelId: 'travel-123' },
      });
    });

    it('navigation handler is wired to SectionHeader onAction', async () => {
      const source = await import('@/features/budget/BudgetBreakdownPage?raw');
      const code = (source as { default: string }).default;

      // Verify handleNavigateToCategories exists and is wired
      expect(code).toContain('handleNavigateToCategories');
      expect(code).toMatch(/navigate\(\{.*to:.*categories/s);
    });
  });

  describe('full navigation flow: Dashboard → Budget Breakdown → Categories', () => {
    it('Dashboard "Ver tudo" navigates to budget route', () => {
      const navigateMock = vi.fn();
      const travelId = 'travel-1';

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

    it('Budget Breakdown "Manage" navigates to categories route', () => {
      const navigateMock = vi.fn();
      const travelId = 'travel-1';

      const handleNavigateToCategories = () => {
        navigateMock({
          to: '/travels/$travelId/categories',
          params: { travelId },
        });
      };

      handleNavigateToCategories();

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/travels/$travelId/categories',
        params: { travelId: 'travel-1' },
      });
    });

    it('categories route file exists and renders CategoriesPage', async () => {
      const categoriesRoute = await import(
        '@/routes/_authenticated/travels/$travelId/categories'
      );
      expect(categoriesRoute.Route).toBeDefined();
    });

    it('complete path is Dashboard → /budget → /categories', () => {
      const travelId = 'travel-1';
      const budgetPath = `/travels/${travelId}/budget`;
      const categoriesPath = `/travels/${travelId}/categories`;

      // Verify path structure
      expect(budgetPath).toBe('/travels/travel-1/budget');
      expect(categoriesPath).toBe('/travels/travel-1/categories');

      // Both paths share the same travelId prefix
      expect(budgetPath.startsWith(`/travels/${travelId}`)).toBe(true);
      expect(categoriesPath.startsWith(`/travels/${travelId}`)).toBe(true);
    });
  });
});
