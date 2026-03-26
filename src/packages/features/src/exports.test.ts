import { describe, it, expect } from 'vitest';
import * as features from './index';

describe('@repo/features exports', () => {
  it('exports all 9 containers', () => {
    expect(features.TripSummaryPage).toBeDefined();
    expect(features.BudgetBreakdownPage).toBeDefined();
    expect(features.DashboardPage).toBeDefined();
    expect(features.TripForm).toBeDefined();
    expect(features.ExpenseList).toBeDefined();
    expect(features.AddExpenseModal).toBeDefined();
    expect(features.CategoriesPage).toBeDefined();
    expect(features.MembersPage).toBeDefined();
  });

  it('exports TravelProvider and useTravelContext', () => {
    expect(features.TravelProvider).toBeDefined();
    expect(features.useTravelContext).toBeDefined();
  });

  it('exports useCategoryForm hook', () => {
    expect(features.useCategoryForm).toBeDefined();
  });

  it('exports all expected items as functions', () => {
    // All containers and hooks should be functions
    const expectedFunctions = [
      'TripSummaryPage',
      'BudgetBreakdownPage',
      'DashboardPage',
      'TripForm',
      'ExpenseList',
      'AddExpenseModal',
      'CategoriesPage',
      'MembersPage',
      'TravelProvider',
      'useTravelContext',
      'useCategoryForm',
    ];

    for (const name of expectedFunctions) {
      expect(typeof (features as Record<string, unknown>)[name]).toBe('function');
    }
  });
});
