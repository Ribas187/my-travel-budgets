import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BudgetBreakdownView, TooltipTip } from '@repo/ui';
import type { Expense } from '@repo/api-client';
import { useDashboard, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';
import { useTip } from '../onboarding/useTip';

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
  const { t } = useTranslation();
  const { travel } = useTravelContext();
  const progressBarRef = useRef<HTMLElement>(null);

  const { data: dashboard, isLoading } = useDashboard(travel.id);
  const { data: expenses } = useTravelExpenses(travel.id);

  const { shouldShow: shouldShowTip, dismiss: dismissTip } = useTip('budget_progress_bar');
  const hasExpenses = !!expenses && expenses.length > 0;

  const expenseCountByCategory = useMemo(
    () => getExpenseCountByCategory(expenses ?? []),
    [expenses],
  );

  return (
    <>
      <BudgetBreakdownView
        dashboard={dashboard ?? null}
        expenseCountByCategory={expenseCountByCategory}
        isLoading={isLoading}
        onManageCategories={onManageCategories}
        progressBarRef={progressBarRef}
      />
      {shouldShowTip && hasExpenses && (
        <TooltipTip
          tipId="budget_progress_bar"
          message={t('onboarding.tip.budgetProgressBar')}
          dismissLabel={t('onboarding.tip.dismiss')}
          onDismiss={dismissTip}
          anchorRef={progressBarRef}
        />
      )}
    </>
  );
}
