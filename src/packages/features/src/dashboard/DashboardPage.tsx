import { useMemo } from 'react';
import { DashboardTemplate } from '@repo/ui';
import { useDashboard, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';

export interface DashboardPageProps {
  onSeeAllCategories: () => void;
  onViewAllExpenses: () => void;
}

export function DashboardPage({ onSeeAllCategories, onViewAllExpenses }: DashboardPageProps) {
  const { travel, onOpenNavigationSheet, onAddExpense } = useTravelContext();

  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard(travel.id);
  const { data: expenses } = useTravelExpenses(travel.id, { limit: 5 });

  const recentExpenses = useMemo(() => {
    if (!expenses) return [];
    return [...expenses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [expenses]);

  const isEmpty = useMemo(() => {
    if (!dashboard) return false;
    return dashboard.overall.totalSpent === 0 && (!expenses || expenses.length === 0);
  }, [dashboard, expenses]);

  return (
    <DashboardTemplate
      dashboard={dashboard ?? null}
      recentExpenses={recentExpenses}
      travel={travel}
      isLoading={isDashboardLoading}
      isEmpty={isEmpty}
      onSeeAllCategories={onSeeAllCategories}
      onViewAllExpenses={onViewAllExpenses}
      onAvatarPress={onOpenNavigationSheet}
      onAddExpense={onAddExpense}
    />
  );
}
