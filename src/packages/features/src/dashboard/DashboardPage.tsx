import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardTemplate, InlineTip } from '@repo/ui';
import { useDashboard, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';
import { useTip } from '../onboarding/useTip';

export interface DashboardPageProps {
  onSeeAllCategories: () => void;
  onViewAllExpenses: () => void;
}

export function DashboardPage({ onSeeAllCategories, onViewAllExpenses }: DashboardPageProps) {
  const { t } = useTranslation();
  const { travel, onOpenNavigationSheet, onAddExpense } = useTravelContext();

  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard(travel.id);
  const { data: expenses } = useTravelExpenses(travel.id, { limit: 5 });

  const { shouldShow: shouldShowTip, dismiss: dismissTip } = useTip('dashboard_first_visit');

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
    <>
      {shouldShowTip && isEmpty && (
        <InlineTip
          tipId="dashboard_first_visit"
          message={t('onboarding.tip.dashboardFirstVisit')}
          icon="📊"
          onDismiss={dismissTip}
        />
      )}
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
    </>
  );
}
