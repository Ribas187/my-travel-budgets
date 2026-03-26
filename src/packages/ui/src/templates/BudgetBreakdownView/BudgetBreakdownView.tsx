import { useTranslation } from 'react-i18next';
import { YStack, Text } from 'tamagui';
import { SectionHeader, SkeletonBox } from '../../atoms';
import { BudgetSummaryCard, CategoryDetailCard } from '../../organisms';
import { formatCurrency } from '../../quarks';
import type { DashboardData } from '@repo/api-client';

interface BudgetBreakdownViewProps {
  dashboard: DashboardData | null;
  expenseCountByCategory: Record<string, number>;
  isLoading: boolean;
  onManageCategories: () => void;
}

function BudgetSkeleton() {
  return (
    <YStack gap="$xl" padding="$screenPaddingHorizontal" paddingTop="$2xl" data-testid="budget-skeleton">
      <SkeletonBox width="100%" height={120} />
      <SkeletonBox width="100%" height={160} />
      <SkeletonBox width="100%" height={160} />
      <SkeletonBox width="100%" height={160} />
    </YStack>
  );
}

export function BudgetBreakdownView({ dashboard, expenseCountByCategory, isLoading, onManageCategories }: BudgetBreakdownViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  if (isLoading) return <BudgetSkeleton />;
  if (!dashboard) return null;

  const { overall, categorySpending, currency } = dashboard;

  return (
    <YStack flex={1} gap="$lg" padding="$screenPaddingHorizontal" paddingTop="$2xl" data-testid="budget-breakdown-page">
      <SectionHeader title={t('budget.title')} action={t('budget.manage')} onAction={onManageCategories} />
      <BudgetSummaryCard totalBudget={overall.budget} totalSpent={overall.totalSpent} categories={categorySpending} currency={currency} locale={locale} />
      <YStack gap="$md" data-testid="category-detail-list">
        {categorySpending.map((cat) => (
          <CategoryDetailCard
            key={cat.categoryId}
            name={cat.name}
            icon={<Text fontSize={20}>{cat.icon}</Text>}
            iconColor={cat.color}
            iconBackground={`${cat.color}20`}
            spent={cat.totalSpent}
            budget={cat.budgetLimit}
            expenseCount={expenseCountByCategory[cat.categoryId] ?? 0}
            currency={currency}
            locale={locale}
            onSetBudget={cat.budgetLimit === null ? onManageCategories : undefined}
            expenseCountLabel={t('budget.expenseCount', { count: expenseCountByCategory[cat.categoryId] ?? 0 })}
            overBudgetByLabel={cat.budgetLimit && cat.totalSpent >= cat.budgetLimit ? t('budget.overBudgetByAmount', { amount: formatCurrency(cat.totalSpent - cat.budgetLimit, currency, locale) }) : undefined}
            onTrackLabel={t('budget.onTrack')}
            setBudgetLabel={t('budget.setBudget')}
          />
        ))}
      </YStack>
    </YStack>
  );
}
