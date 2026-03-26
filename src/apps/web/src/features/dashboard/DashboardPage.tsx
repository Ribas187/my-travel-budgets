import { useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DashboardTemplate } from '@repo/ui';

import { useDashboard, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '@/contexts/TravelContext';

export function DashboardPage() {
  const { travel, onOpenNavigationSheet, onAddExpense } = useTravelContext();
  const navigate = useNavigate();

  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard(travel.id);
  const { data: expenses } = useTravelExpenses(travel.id, { limit: 5 });

  const handleSeeAllCategories = useCallback(() => {
    navigate({ to: '/travels/$travelId/budget', params: { travelId: travel.id } });
  }, [navigate, travel.id]);

  const handleViewAllExpenses = useCallback(() => {
    navigate({ to: '/travels/$travelId/expenses', params: { travelId: travel.id } });
  }, [navigate, travel.id]);

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
      onSeeAllCategories={handleSeeAllCategories}
      onViewAllExpenses={handleViewAllExpenses}
      onAvatarPress={onOpenNavigationSheet}
      onAddExpense={onAddExpense}
    />
  );
}
