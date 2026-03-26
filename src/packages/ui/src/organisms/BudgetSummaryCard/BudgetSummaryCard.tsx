import { XStack, YStack, Text } from 'tamagui';
import { StackedBar, ColorLegend } from '../../atoms';
import { formatCurrency } from '../../quarks';
import { useTranslation } from 'react-i18next';
import type { CategorySpending } from '@repo/api-client';

interface BudgetSummaryCardProps {
  totalBudget: number;
  totalSpent: number;
  categories: CategorySpending[];
  currency: string;
  locale: string;
}

export function BudgetSummaryCard({ totalBudget, totalSpent, categories, currency, locale }: BudgetSummaryCardProps) {
  const { t } = useTranslation();

  const segments = categories
    .filter((cat) => cat.totalSpent > 0)
    .map((cat) => ({ id: cat.categoryId, value: cat.totalSpent, color: cat.color }));

  const legendItems = categories
    .filter((cat) => cat.totalSpent > 0)
    .map((cat) => ({
      id: cat.categoryId,
      label: `${cat.name} ${formatCurrency(cat.totalSpent, currency, locale)}`,
      color: cat.color,
    }));

  return (
    <YStack backgroundColor="$white" borderRadius="$2xl" borderWidth={1} borderColor="$borderDefault" padding="$lg" gap="$md" data-testid="budget-summary-card">
      <XStack justifyContent="space-between" alignItems="flex-end">
        <YStack>
          <Text fontFamily="$body" fontSize={13} color="$textTertiary">{t('budget.totalBudget')}</Text>
          <Text fontFamily="$heading" fontSize={28} fontWeight="700" color="$textPrimary">{formatCurrency(totalBudget, currency, locale)}</Text>
        </YStack>
        <YStack alignItems="flex-end">
          <Text fontFamily="$body" fontSize={13} color="$textTertiary">{t('budget.totalSpent')}</Text>
          <Text fontFamily="$heading" fontSize={28} fontWeight="700" color={totalSpent >= totalBudget ? '$coral500' : '$textPrimary'}>{formatCurrency(totalSpent, currency, locale)}</Text>
        </YStack>
      </XStack>
      <StackedBar segments={segments} total={totalSpent} />
      <ColorLegend items={legendItems} />
    </YStack>
  );
}
