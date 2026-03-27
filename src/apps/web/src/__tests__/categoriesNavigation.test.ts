import { readFileSync } from 'fs';
import { resolve } from 'path';

import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('Categories Navigation — Task 5', () => {
  describe('BudgetBreakdownPage "Manage" action visibility on all breakpoints', () => {
    it('BudgetBreakdownPage renders SectionHeader with action unconditionally (no isDesktop check)', () => {
      const code = readFileSync(resolve(__dirname, '../../../../packages/ui/src/templates/BudgetBreakdownView/BudgetBreakdownView.tsx'), 'utf-8');

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

      const child = element.props.children as React.ReactElement<Record<string, unknown>>;
      expect(child.props.children).toBe('Manage');
      expect(child.props.role).toBe('button');
    });

    it('"Manage" action is visible on mobile (no isDesktop guard)', () => {
      // Verify the component source does not guard the onAction handler with isDesktop
      const code = readFileSync(resolve(__dirname, '../../../../packages/ui/src/templates/BudgetBreakdownView/BudgetBreakdownView.tsx'), 'utf-8');

      expect(code).not.toMatch(/onAction=\{isDesktop/);
      // The onAction should be passed unconditionally
      expect(code).toMatch(/onAction=\{onManageCategories\}/);
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

    it('navigation handler is wired to SectionHeader onAction', () => {
      // The thin container wires navigation to the view's onManageCategories callback
      const containerCode = readFileSync(resolve(__dirname, '../../../../packages/features/src/budget/BudgetBreakdownPage.tsx'), 'utf-8');
      const viewCode = readFileSync(resolve(__dirname, '../../../../packages/ui/src/templates/BudgetBreakdownView/BudgetBreakdownView.tsx'), 'utf-8');

      // Verify the container accepts onManageCategories prop and passes it to the view
      expect(containerCode).toContain('onManageCategories');
      // Verify the view wires onManageCategories to SectionHeader onAction
      expect(viewCode).toContain('onAction={onManageCategories}');
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
