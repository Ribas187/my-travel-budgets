import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BudgetBreakdownView } from '@repo/ui';
import type { Expense } from '@repo/api-client';

import { useTravelContext } from '@/contexts/TravelContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useTravelExpenses } from '@/hooks/useTravelExpenses';

function getExpenseCountByCategory(expenses: Expense[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const exp of expenses) {
    counts[exp.categoryId] = (counts[exp.categoryId] ?? 0) + 1;
  }
  return counts;
}

export function BudgetBreakdownPage() {
  const { travel } = useTravelContext();
  const navigate = useNavigate();

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
      onManageCategories={() =>
        navigate({ to: '/travels/$travelId/categories', params: { travelId: travel.id } })
      }
    />
  );
}
