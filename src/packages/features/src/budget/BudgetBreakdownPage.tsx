import { useMemo } from 'react';
import { BudgetBreakdownView } from '@repo/ui';
import type { Expense } from '@repo/api-client';
import { useDashboard, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';

export function getExpenseCountByCategory(expenses: Expense[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const exp of expenses) {
    counts[exp.categoryId] = (counts[exp.categoryId] ?? 0) + 1;
  }
  return counts;
}

export interface BudgetBreakdownPageProps {
  onManageCategories: () => void;
}

export function BudgetBreakdownPage({ onManageCategories }: BudgetBreakdownPageProps) {
  const { travel } = useTravelContext();

  const { data: dashboard, isLoading } = useDashboard(travel.id);
  const { data: expenses } = useTravelExpenses(travel.id);

  const expenseCountByCategory = useMemo(
    () => getExpenseCountByCategory(expenses ?? []),
    [expenses],
  );

  return (
    <BudgetBreakdownView
      dashboard={dashboard ?? null}
      expenseCountByCategory={expenseCountByCategory}
      isLoading={isLoading}
      onManageCategories={onManageCategories}
    />
  );
}
