import { useTranslation } from 'react-i18next';
import { XStack, YStack, Text, useMedia } from 'tamagui';
import { BudgetRing, Heading, Body, SkeletonBox, SectionHeader } from '../../atoms';
import { CategoryProgressRow, StatCard, ExpenseRow, EmptyState } from '../../molecules';
import { DashboardHeader } from '../../organisms';
import { formatCurrency, formatAmount, formatTime, getMemberDisplayName, getDaysSinceStart, getTripTotalDays } from '../../quarks';
import { type DashboardData, type TravelDetail, type Expense, type CategorySpending, useUserMe } from '@repo/api-client';

interface DashboardTemplateProps {
  dashboard: DashboardData | null;
  recentExpenses: Expense[];
  travel: TravelDetail;
  isLoading: boolean;
  isEmpty: boolean;
  onSeeAllCategories: () => void;
  onViewAllExpenses: () => void;
  onAvatarPress?: () => void;
  onAddExpense?: () => void;
}

function getCategoryFromTravel(categoryId: string, travel: TravelDetail) {
  return (travel.categories ?? []).find((c) => c.id === categoryId);
}

function getMemberName(memberId: string, travel: TravelDetail): string {
  const member = (travel.members ?? []).find((m) => m.id === memberId);
  if (!member) return '';
  return getMemberDisplayName(member);
}

// --- Skeleton ---
function DashboardSkeleton() {
  return (
    <YStack gap="$xl" padding="$screenPaddingHorizontal" paddingTop="$2xl" data-testid="dashboard-skeleton">
      <YStack alignItems="center">
        <SkeletonBox width={180} height={180} />
      </YStack>
      <XStack justifyContent="space-around">
        <SkeletonBox width={80} height={40} />
        <SkeletonBox width={80} height={40} />
        <SkeletonBox width={80} height={40} />
      </XStack>
      <YStack gap="$md">
        <SkeletonBox width={120} height={20} />
        <SkeletonBox width="100%" height={44} />
        <SkeletonBox width="100%" height={44} />
        <SkeletonBox width="100%" height={44} />
      </YStack>
      <YStack gap="$md">
        <SkeletonBox width={150} height={20} />
        <SkeletonBox width="100%" height={44} />
        <SkeletonBox width="100%" height={44} />
      </YStack>
    </YStack>
  );
}

// --- Stats Row ---
function StatsRow({ spent, remaining, currency, locale, t }: { spent: number; remaining: number; currency: string; locale: string; t: (key: string) => string }) {
  return (
    <XStack justifyContent="space-around" paddingVertical="$md" data-testid="stats-row">
      <YStack alignItems="center" gap="$xs">
        <Text fontFamily="$body" fontSize={13} color="$textTertiary">● {t('dashboard.spent')} {formatCurrency(spent, currency, locale)}</Text>
      </YStack>
      <YStack alignItems="center" gap="$xs">
        <Text fontFamily="$body" fontSize={13} color="$textTertiary">● {t('dashboard.remaining')} {formatCurrency(remaining, currency, locale)}</Text>
      </YStack>
    </XStack>
  );
}

// --- Category List ---
function CategoryList({ categories, currency, locale }: { categories: CategorySpending[]; currency: string; locale: string }) {
  return (
    <YStack data-testid="category-list">
      {categories.map((cat) => (
        <CategoryProgressRow key={cat.categoryId} name={cat.name} icon={<Text fontSize={20}>{cat.icon}</Text>} iconColor={cat.color} iconBackground={`${cat.color}20`} spent={cat.totalSpent} budget={cat.budgetLimit} currency={currency} locale={locale} />
      ))}
    </YStack>
  );
}

// --- Recent Expenses ---
function RecentExpensesList({ expenses, travel, locale }: { expenses: Expense[]; travel: TravelDetail; locale: string }) {
  return (
    <YStack data-testid="recent-expenses">
      {expenses.map((expense) => {
        const category = getCategoryFromTravel(expense.categoryId, travel);
        return (
          <ExpenseRow key={expense.id} title={expense.description} category={category?.name ?? ''} time={formatTime(expense.createdAt, locale)} paidBy={getMemberName(expense.memberId, travel)} amount={formatAmount(expense.amount, travel.currency, locale)} icon={<Text fontSize={20}>{category?.icon ?? '📝'}</Text>} iconBackgroundColor={category?.color ? `${category.color}20` : undefined} />
        );
      })}
    </YStack>
  );
}

// --- Mobile Layout ---
function MobileLayout({ dashboard, recentExpenses, travel, locale, t, onSeeAllCategories, onViewAllExpenses, onAvatarPress, isEmpty, onAddExpense }: {
  dashboard: DashboardData; recentExpenses: Expense[]; travel: TravelDetail; locale: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onSeeAllCategories: () => void; onViewAllExpenses: () => void; onAvatarPress?: () => void; isEmpty?: boolean; onAddExpense?: () => void;
}) {
  const { overall, categorySpending, currency } = dashboard;
  const remaining = Math.max(0, overall.budget - overall.totalSpent);
  const daysSinceStart = getDaysSinceStart(travel.startDate, travel.endDate);
  const totalDays = getTripTotalDays(travel.startDate, travel.endDate);
  const { data: user } = useUserMe();
  const memberName = user?.name ?? '';
  const memberAvatarUrl = user?.avatarUrl ?? null;
  

  return (
    <YStack gap="$lg" flex={1} data-testid="dashboard-mobile">
      <DashboardHeader travelName={travel.name} userName={memberName} avatarUrl={memberAvatarUrl} onAvatarPress={onAvatarPress} openMenuLabel={t('nav.openMenu')} />

      {isEmpty ? (
        <EmptyState icon="📊" title={t('dashboard.emptyTitle')} ctaLabel={t('dashboard.emptyAction')} onCta={onAddExpense} testID="dashboard-empty" />
      ) : (
        <>
          <YStack alignItems="center" paddingHorizontal="$screenPaddingHorizontal">
            <BudgetRing total={overall.budget} spent={overall.totalSpent} currency={currency} locale={locale} remainingLabel={t('budget.remaining')} spentLabel={t('budget.spent')} />
          </YStack>

          <YStack gap="$lg" paddingHorizontal="$screenPaddingHorizontal">
            <StatsRow spent={overall.totalSpent} remaining={remaining} currency={currency} locale={locale} t={t} />
            <Body size="secondary" textAlign="center" color="$textTertiary">
              {t('dashboard.dayOfTrip', { current: daysSinceStart, total: totalDays })}
            </Body>

            <YStack>
              <SectionHeader title={t('dashboard.byCategory')} action={t('dashboard.seeAll')} onAction={onSeeAllCategories} />
              <CategoryList categories={categorySpending} currency={currency} locale={locale} />
            </YStack>

            {recentExpenses.length > 0 && (
              <YStack>
                <SectionHeader title={t('dashboard.recentExpenses')} action={t('dashboard.viewAll')} onAction={onViewAllExpenses} />
                <RecentExpensesList expenses={recentExpenses} travel={travel} locale={locale} />
              </YStack>
            )}
          </YStack>
        </>
      )}
    </YStack>
  );
}

// --- Desktop Layout ---
function DesktopLayout({ dashboard, recentExpenses, travel, locale, t, onSeeAllCategories, onViewAllExpenses, isEmpty, onAddExpense }: {
  dashboard: DashboardData; recentExpenses: Expense[]; travel: TravelDetail; locale: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onSeeAllCategories: () => void; onViewAllExpenses: () => void; isEmpty?: boolean; onAddExpense?: () => void;
}) {
  const { overall, categorySpending, currency } = dashboard;
  const remaining = Math.max(0, overall.budget - overall.totalSpent);
  const daysSinceStart = getDaysSinceStart(travel.startDate, travel.endDate);
  const avgPerDay = overall.totalSpent / daysSinceStart;

  if (isEmpty) {
    return (
      <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl" data-testid="dashboard-desktop">
        <EmptyState icon="📊" title={t('dashboard.emptyTitle')} ctaLabel={t('dashboard.emptyAction')} onCta={onAddExpense} testID="dashboard-empty" />
      </YStack>
    );
  }

  return (
    <YStack gap="$xl" padding="$screenPaddingHorizontal" paddingTop="$2xl" data-testid="dashboard-desktop">
      <XStack gap="$md" data-testid="stat-card-row">
        <YStack flex={1}><StatCard label={t('dashboard.totalBudget')} value={formatCurrency(overall.budget, currency, locale)} /></YStack>
        <YStack flex={1}><StatCard label={t('dashboard.spentSoFar')} value={formatCurrency(overall.totalSpent, currency, locale)} valueColor={overall.status === 'exceeded' ? '$coral500' : undefined} /></YStack>
        <YStack flex={1}><StatCard label={t('dashboard.remaining')} value={formatCurrency(remaining, currency, locale)} /></YStack>
        <YStack flex={1}><StatCard label={t('dashboard.dailyAverage')} value={formatCurrency(avgPerDay, currency, locale)} /></YStack>
      </XStack>

      <XStack gap="$xl">
        <YStack flex={1} backgroundColor="$white" borderRadius="$2xl" borderWidth={1} borderColor="$borderDefault" padding="$cardPadding">
          <SectionHeader title={t('dashboard.budgetByCategory')} action={t('dashboard.seeAll')} onAction={onSeeAllCategories} />
          <CategoryList categories={categorySpending} currency={currency} locale={locale} />
        </YStack>
        <YStack flex={1} backgroundColor="$white" borderRadius="$2xl" borderWidth={1} borderColor="$borderDefault" padding="$cardPadding">
          <SectionHeader title={t('dashboard.recentExpenses')} action={t('dashboard.viewAll')} onAction={onViewAllExpenses} />
          {recentExpenses.length > 0 ? (
            <RecentExpensesList expenses={recentExpenses} travel={travel} locale={locale} />
          ) : (
            <Body size="secondary" color="$textTertiary" paddingVertical="$xl" textAlign="center">{t('dashboard.emptyTitle')}</Body>
          )}
        </YStack>
      </XStack>
    </YStack>
  );
}

// --- Main Template ---
export function DashboardTemplate({ dashboard, recentExpenses, travel, isLoading, isEmpty, onSeeAllCategories, onViewAllExpenses, onAvatarPress, onAddExpense }: DashboardTemplateProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const media = useMedia();
  const isDesktop = media.gtTablet;

  if (isLoading) return <DashboardSkeleton />;
  if (!dashboard) return null;

  if (isDesktop) {
    return <DesktopLayout dashboard={dashboard} recentExpenses={recentExpenses} travel={travel} locale={locale} t={t} onSeeAllCategories={onSeeAllCategories} onViewAllExpenses={onViewAllExpenses} isEmpty={isEmpty} onAddExpense={onAddExpense} />;
  }

  return <MobileLayout dashboard={dashboard} recentExpenses={recentExpenses} travel={travel} locale={locale} t={t} onSeeAllCategories={onSeeAllCategories} onViewAllExpenses={onViewAllExpenses} onAvatarPress={onAvatarPress} isEmpty={isEmpty} onAddExpense={onAddExpense} />;
}
