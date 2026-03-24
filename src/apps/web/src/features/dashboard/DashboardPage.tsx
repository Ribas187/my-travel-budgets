import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { User } from 'lucide-react';
import { XStack, YStack, Text, useMedia, Separator, styled } from 'tamagui';
import { BudgetRing, CategoryProgressRow, StatCard, ExpenseRow, Heading, Body } from '@repo/ui';
import type { DashboardData, TravelDetail, Expense, CategorySpending } from '@repo/api-client';

import { useTravelContext } from '@/contexts/TravelContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useTravelExpenses } from '@/hooks/useTravelExpenses';

type TFunction = (key: string, opts?: Record<string, unknown>) => string;

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getMemberName(memberId: string, travel: TravelDetail): string {
  const member = (travel.members ?? []).find((m) => m.id === memberId);
  if (!member) return '';
  return member.user?.name ?? member.guestName ?? member.user?.email ?? '';
}

function getDaysSinceStart(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const effectiveEnd = today < end ? today : end;
  const diffMs = effectiveEnd.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

function getTripTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function getCategoryFromTravel(categoryId: string, travel: TravelDetail) {
  return (travel.categories ?? []).find((c) => c.id === categoryId);
}

// --- Skeleton Components ---

function SkeletonBox({ width, height }: { width: number | string; height: number }) {
  return (
    <YStack
      width={width}
      height={height}
      backgroundColor="$sand"
      borderRadius="$md"
      opacity={0.6}
    />
  );
}

function DashboardSkeleton() {
  return (
    <YStack
      gap="$xl"
      padding="$screenPaddingHorizontal"
      paddingTop="$2xl"
      data-testid="dashboard-skeleton"
    >
      {/* BudgetRing skeleton */}
      <YStack alignItems="center">
        <SkeletonBox width={180} height={180} />
      </YStack>
      {/* Stats row skeleton */}
      <XStack justifyContent="space-around">
        <SkeletonBox width={80} height={40} />
        <SkeletonBox width={80} height={40} />
        <SkeletonBox width={80} height={40} />
      </XStack>
      {/* Category rows skeleton */}
      <YStack gap="$md">
        <SkeletonBox width={120} height={20} />
        <SkeletonBox width="100%" height={44} />
        <SkeletonBox width="100%" height={44} />
        <SkeletonBox width="100%" height={44} />
      </YStack>
      {/* Recent expenses skeleton */}
      <YStack gap="$md">
        <SkeletonBox width={150} height={20} />
        <SkeletonBox width="100%" height={44} />
        <SkeletonBox width="100%" height={44} />
      </YStack>
    </YStack>
  );
}

// --- Empty State ---

function EmptyState({ onAddExpense, t }: { onAddExpense: () => void; t: (key: string) => string }) {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$screenPaddingHorizontal"
      gap="$lg"
      data-testid="dashboard-empty"
    >
      <Text fontSize={64}>📊</Text>
      <Heading level={3} textAlign="center">
        {t('dashboard.emptyTitle')}
      </Heading>
      <YStack
        backgroundColor="$terracotta500"
        paddingHorizontal="$xl"
        paddingVertical="$md"
        borderRadius="$pill"
        cursor="pointer"
        pressStyle={{ opacity: 0.8 }}
        onPress={onAddExpense}
        role="button"
        aria-label={t('dashboard.emptyAction')}
      >
        <Text color="$white" fontFamily="$body" fontWeight="600" fontSize={15}>
          {t('dashboard.emptyAction')}
        </Text>
      </YStack>
    </YStack>
  );
}

// --- Stats Row (Mobile) ---

function StatsRow({
  spent,
  remaining,
  avgPerDay,
  currency,
  locale,
  dayLabel,
  t,
}: {
  spent: number;
  remaining: number;
  avgPerDay: number;
  currency: string;
  locale: string;
  dayLabel: string;
  t: (key: string) => string;
}) {
  return (
    <XStack justifyContent="space-around" paddingVertical="$md" data-testid="stats-row">
      <YStack alignItems="center" gap="$xs">
        <Text fontFamily="$body" fontSize={13} color="$textTertiary">
          ● {t('dashboard.spent')} {formatCurrency(spent, currency, locale)}
        </Text>
      </YStack>
      <YStack alignItems="center" gap="$xs">
        <Text fontFamily="$body" fontSize={13} color="$textTertiary">
          ● {t('dashboard.remaining')} {formatCurrency(remaining, currency, locale)}
        </Text>
      </YStack>
    </XStack>
  );
}

// --- Section Header ---

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical="$sm">
      <Heading level={4}>{title}</Heading>
      {action && (
        <Text
          fontFamily="$body"
          fontSize={14}
          color="$terracotta500"
          fontWeight="600"
          cursor={onAction ? 'pointer' : undefined}
          onPress={onAction}
          role={onAction ? 'button' : undefined}
          hoverStyle={onAction ? { opacity: 0.7 } : undefined}
          pressStyle={onAction ? { opacity: 0.7 } : undefined}
        >
          {action}
        </Text>
      )}
    </XStack>
  );
}

// --- Category List ---

function CategoryList({
  categories,
  currency,
  locale,
}: {
  categories: CategorySpending[];
  currency: string;
  locale: string;
}) {
  return (
    <YStack data-testid="category-list">
      {categories.map((cat) => (
        <CategoryProgressRow
          key={cat.categoryId}
          name={cat.name}
          icon={<Text fontSize={20}>{cat.icon}</Text>}
          iconColor={cat.color}
          iconBackground={`${cat.color}20`}
          spent={cat.totalSpent}
          budget={cat.budgetLimit}
          currency={currency}
          locale={locale}
        />
      ))}
    </YStack>
  );
}

// --- Recent Expenses ---

function RecentExpenses({
  expenses,
  travel,
  locale,
}: {
  expenses: Expense[];
  travel: TravelDetail;
  locale: string;
}) {
  return (
    <YStack data-testid="recent-expenses">
      {expenses.map((expense) => {
        const category = getCategoryFromTravel(expense.categoryId, travel);
        return (
          <ExpenseRow
            key={expense.id}
            title={expense.description}
            category={category?.name ?? ''}
            time={formatTime(expense.createdAt, locale)}
            paidBy={getMemberName(expense.memberId, travel)}
            amount={formatAmount(expense.amount, travel.currency, locale)}
            icon={<Text fontSize={20}>{category?.icon ?? '📝'}</Text>}
            iconBackgroundColor={category?.color ? `${category.color}20` : undefined}
          />
        );
      })}
    </YStack>
  );
}

// --- Header Avatar ---

const HeaderAvatarCircle = styled(XStack, {
  width: 36,
  height: 36,
  borderRadius: '$full',
  backgroundColor: '$brandPrimary',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pressStyle: { opacity: 0.7 },
});

function DashboardHeader({
  travelName,
  userInitial,
  onAvatarPress,
  openMenuLabel = 'Open navigation menu',
}: {
  travelName: string;
  userInitial?: string;
  onAvatarPress?: () => void;
  openMenuLabel?: string;
}) {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      paddingHorizontal="$screenPaddingHorizontal"
      paddingTop="$lg"
      paddingBottom="$sm"
    >
      <Heading level={3}>{travelName}</Heading>
      <HeaderAvatarCircle
        onPress={onAvatarPress}
        role="button"
        aria-label={openMenuLabel}
        data-testid="header-avatar"
      >
        {userInitial ? (
          <Text fontFamily="$heading" fontSize={16} fontWeight="600" color="$white">
            {userInitial}
          </Text>
        ) : (
          <User size={18} color="white" role="img" aria-label="User" />
        )}
      </HeaderAvatarCircle>
    </XStack>
  );
}

// --- Mobile Layout ---

function MobileLayout({
  dashboard,
  recentExpenses,
  travel,
  locale,
  t,
  onSeeAllCategories,
  onViewAllExpenses,
  onAvatarPress,
  isEmpty,
  onAddExpense,
}: {
  dashboard: DashboardData;
  recentExpenses: Expense[];
  travel: TravelDetail;
  locale: string;
  t: TFunction;
  onSeeAllCategories: () => void;
  onViewAllExpenses: () => void;
  onAvatarPress?: () => void;
  isEmpty?: boolean;
  onAddExpense?: () => void;
}) {
  const { overall, categorySpending, currency } = dashboard;
  const remaining = Math.max(0, overall.budget - overall.totalSpent);
  const daysSinceStart = getDaysSinceStart(travel.startDate, travel.endDate);
  const totalDays = getTripTotalDays(travel.startDate, travel.endDate);
  const avgPerDay = overall.totalSpent / daysSinceStart;

  // Derive user initial from travel members
  const currentMember = (travel.members ?? []).find((m) => m.userId != null);
  const memberName = currentMember?.user?.name ?? '';
  const userInitial = memberName ? memberName.charAt(0).toUpperCase() : undefined;

  return (
    <YStack
      gap="$lg"
      flex={1}
      data-testid="dashboard-mobile"
    >
      <DashboardHeader
        travelName={travel.name}
        userInitial={userInitial}
        onAvatarPress={onAvatarPress}
        openMenuLabel={t('nav.openMenu')}
      />

      {isEmpty ? (
        <EmptyState onAddExpense={onAddExpense ?? (() => {})} t={t} />
      ) : (
        <>
          {/* BudgetRing */}
          <YStack alignItems="center" paddingHorizontal="$screenPaddingHorizontal">
            <BudgetRing
              total={overall.budget}
              spent={overall.totalSpent}
              currency={currency}
              locale={locale}
              remainingLabel={t('budget.remaining')}
              spentLabel={t('budget.spent')}
            />
          </YStack>

          <YStack gap="$lg" paddingHorizontal="$screenPaddingHorizontal">
            {/* Stats row */}
            <StatsRow
              spent={overall.totalSpent}
              remaining={remaining}
              avgPerDay={avgPerDay}
              currency={currency}
              locale={locale}
              dayLabel={t('dashboard.dayOfTrip', { current: daysSinceStart, total: totalDays })}
              t={t}
            />

            <Body size="secondary" textAlign="center" color="$textTertiary">
              {t('dashboard.dayOfTrip', { current: daysSinceStart, total: totalDays })}
            </Body>

            {/* By Category */}
            <YStack>
              <SectionHeader
                title={t('dashboard.byCategory')}
                action={t('dashboard.seeAll')}
                onAction={onSeeAllCategories}
              />
              <CategoryList categories={categorySpending} currency={currency} locale={locale} />
            </YStack>

            {/* Recent Expenses */}
            {recentExpenses.length > 0 && (
              <YStack>
                <SectionHeader
                  title={t('dashboard.recentExpenses')}
                  action={t('dashboard.viewAll')}
                  onAction={onViewAllExpenses}
                />
                <RecentExpenses expenses={recentExpenses} travel={travel} locale={locale} />
              </YStack>
            )}
          </YStack>
        </>
      )}
    </YStack>
  );
}

// --- Desktop Layout ---

function DesktopLayout({
  dashboard,
  recentExpenses,
  travel,
  locale,
  t,
  onSeeAllCategories,
  onViewAllExpenses,
  isEmpty,
  onAddExpense,
}: {
  dashboard: DashboardData;
  recentExpenses: Expense[];
  travel: TravelDetail;
  locale: string;
  t: TFunction;
  onSeeAllCategories: () => void;
  onViewAllExpenses: () => void;
  isEmpty?: boolean;
  onAddExpense?: () => void;
}) {
  const { overall, categorySpending, currency } = dashboard;
  const remaining = Math.max(0, overall.budget - overall.totalSpent);
  const daysSinceStart = getDaysSinceStart(travel.startDate, travel.endDate);
  const avgPerDay = overall.totalSpent / daysSinceStart;

  if (isEmpty) {
    return (
      <YStack
        flex={1}
        padding="$screenPaddingHorizontal"
        paddingTop="$2xl"
        data-testid="dashboard-desktop"
      >
        <EmptyState onAddExpense={onAddExpense ?? (() => {})} t={t} />
      </YStack>
    );
  }

  return (
    <YStack
      gap="$xl"
      padding="$screenPaddingHorizontal"
      paddingTop="$2xl"
      data-testid="dashboard-desktop"
    >
      {/* 4-column StatCard row */}
      <XStack gap="$md" data-testid="stat-card-row">
        <YStack flex={1}>
          <StatCard
            label={t('dashboard.totalBudget')}
            value={formatCurrency(overall.budget, currency, locale)}
          />
        </YStack>
        <YStack flex={1}>
          <StatCard
            label={t('dashboard.spentSoFar')}
            value={formatCurrency(overall.totalSpent, currency, locale)}
            valueColor={overall.status === 'exceeded' ? '$coral500' : undefined}
          />
        </YStack>
        <YStack flex={1}>
          <StatCard
            label={t('dashboard.remaining')}
            value={formatCurrency(remaining, currency, locale)}
          />
        </YStack>
        <YStack flex={1}>
          <StatCard
            label={t('dashboard.dailyAverage')}
            value={formatCurrency(avgPerDay, currency, locale)}
          />
        </YStack>
      </XStack>

      {/* Two-column layout */}
      <XStack gap="$xl">
        {/* Left: Budget by Category */}
        <YStack
          flex={1}
          backgroundColor="$white"
          borderRadius="$2xl"
          borderWidth={1}
          borderColor="$borderDefault"
          padding="$cardPadding"
        >
          <SectionHeader
            title={t('dashboard.budgetByCategory')}
            action={t('dashboard.seeAll')}
            onAction={onSeeAllCategories}
          />
          <CategoryList categories={categorySpending} currency={currency} locale={locale} />
        </YStack>

        {/* Right: Recent Expenses */}
        <YStack
          flex={1}
          backgroundColor="$white"
          borderRadius="$2xl"
          borderWidth={1}
          borderColor="$borderDefault"
          padding="$cardPadding"
        >
          <SectionHeader
            title={t('dashboard.recentExpenses')}
            action={t('dashboard.viewAll')}
            onAction={onViewAllExpenses}
          />
          {recentExpenses.length > 0 ? (
            <RecentExpenses expenses={recentExpenses} travel={travel} locale={locale} />
          ) : (
            <Body size="secondary" color="$textTertiary" paddingVertical="$xl" textAlign="center">
              {t('dashboard.emptyTitle')}
            </Body>
          )}
        </YStack>
      </XStack>
    </YStack>
  );
}

// --- Main Dashboard Page ---

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { travel, onOpenNavigationSheet, onAddExpense } = useTravelContext();
  const locale = i18n.language;
  const media = useMedia();
  const isDesktop = media.gtTablet;
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

  if (isDashboardLoading) {
    return <DashboardSkeleton />;
  }

  if (!dashboard) {
    return null;
  }

  if (isDesktop) {
    return (
      <DesktopLayout
        dashboard={dashboard}
        recentExpenses={recentExpenses}
        travel={travel}
        locale={locale}
        t={t}
        onSeeAllCategories={handleSeeAllCategories}
        onViewAllExpenses={handleViewAllExpenses}
        isEmpty={isEmpty}
        onAddExpense={onAddExpense}
      />
    );
  }

  return (
    <MobileLayout
      dashboard={dashboard}
      recentExpenses={recentExpenses}
      travel={travel}
      locale={locale}
      t={t}
      onSeeAllCategories={handleSeeAllCategories}
      onViewAllExpenses={handleViewAllExpenses}
      onAvatarPress={onOpenNavigationSheet}
      isEmpty={isEmpty}
      onAddExpense={onAddExpense}
    />
  );
}
