import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { XStack, YStack, View, Text, useMedia } from 'tamagui'
import { CategoryDetailCard, Heading, Body } from '@repo/ui'
import type { CategorySpending, Expense } from '@repo/api-client'
import { useTravelContext } from '@/contexts/TravelContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useTravelExpenses } from '@/hooks/useTravelExpenses'

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getExpenseCountByCategory(expenses: Expense[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const exp of expenses) {
    counts[exp.categoryId] = (counts[exp.categoryId] ?? 0) + 1
  }
  return counts
}

// --- Skeleton ---

function SkeletonBox({ width, height }: { width: number | string; height: number }) {
  return (
    <YStack
      width={width}
      height={height}
      backgroundColor="$sand"
      borderRadius="$md"
      opacity={0.6}
    />
  )
}

function BudgetSkeleton() {
  return (
    <YStack gap="$xl" padding="$screenPaddingHorizontal" paddingTop="$2xl" data-testid="budget-skeleton">
      <SkeletonBox width="100%" height={120} />
      <SkeletonBox width="100%" height={160} />
      <SkeletonBox width="100%" height={160} />
      <SkeletonBox width="100%" height={160} />
    </YStack>
  )
}

// --- Stacked Bar ---

function StackedBar({
  categories,
  totalSpent,
}: {
  categories: CategorySpending[]
  totalSpent: number
}) {
  if (totalSpent === 0) return null

  return (
    <XStack
      height={8}
      borderRadius={4}
      overflow="hidden"
      data-testid="stacked-bar"
    >
      {categories
        .filter((cat) => cat.totalSpent > 0)
        .map((cat) => (
          <View
            key={cat.categoryId}
            flex={cat.totalSpent / totalSpent}
            backgroundColor={cat.color}
            height={8}
            data-testid={`stacked-bar-segment-${cat.categoryId}`}
          />
        ))}
    </XStack>
  )
}

// --- Color Legend ---

function ColorLegend({
  categories,
  currency,
  locale,
}: {
  categories: CategorySpending[]
  currency: string
  locale: string
}) {
  return (
    <XStack flexWrap="wrap" gap="$md" data-testid="color-legend">
      {categories
        .filter((cat) => cat.totalSpent > 0)
        .map((cat) => (
          <XStack key={cat.categoryId} alignItems="center" gap="$xs">
            <View
              width={10}
              height={10}
              borderRadius={5}
              backgroundColor={cat.color}
            />
            <Text fontFamily="$body" fontSize={13} color="$textTertiary">
              {cat.name} {formatCurrency(cat.totalSpent, currency, locale)}
            </Text>
          </XStack>
        ))}
    </XStack>
  )
}

// --- Summary Card ---

function SummaryCard({
  totalBudget,
  totalSpent,
  categories,
  currency,
  locale,
  t,
}: {
  totalBudget: number
  totalSpent: number
  categories: CategorySpending[]
  currency: string
  locale: string
  t: (key: string) => string
}) {
  return (
    <YStack
      backgroundColor="$white"
      borderRadius="$2xl"
      borderWidth={1}
      borderColor="$borderDefault"
      padding="$lg"
      gap="$md"
      data-testid="budget-summary-card"
    >
      {/* Total Budget vs Total Spent */}
      <XStack justifyContent="space-between" alignItems="flex-end">
        <YStack>
          <Text fontFamily="$body" fontSize={13} color="$textTertiary">
            {t('budget.totalBudget')}
          </Text>
          <Text fontFamily="$heading" fontSize={28} fontWeight="700" color="$textPrimary">
            {formatCurrency(totalBudget, currency, locale)}
          </Text>
        </YStack>
        <YStack alignItems="flex-end">
          <Text fontFamily="$body" fontSize={13} color="$textTertiary">
            {t('budget.totalSpent')}
          </Text>
          <Text
            fontFamily="$heading"
            fontSize={28}
            fontWeight="700"
            color={totalSpent >= totalBudget ? '$coral500' : '$textPrimary'}
          >
            {formatCurrency(totalSpent, currency, locale)}
          </Text>
        </YStack>
      </XStack>

      {/* Stacked Bar */}
      <StackedBar categories={categories} totalSpent={totalSpent} />

      {/* Color Legend */}
      <ColorLegend categories={categories} currency={currency} locale={locale} />
    </YStack>
  )
}

// --- Section Header ---

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title?: string
  action?: string
  onAction?: () => void
}) {
  if (!title) return null
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical="$sm">
      {title && <Heading level={4}>{title}</Heading>}
      {action && (
        <Text
          fontFamily="$body"
          fontSize={14}
          color="$terracotta500"
          fontWeight="600"
          cursor="pointer"
          onPress={onAction}
          role="button"
        >
          {action}
        </Text>
      )}
    </XStack>
  )
}

// --- Main Component ---

export function BudgetBreakdownPage() {
  const { t, i18n } = useTranslation()
  const { travel } = useTravelContext()
  const locale = i18n.language
  const navigate = useNavigate()
  const media = useMedia()
  const isDesktop = media.gtTablet

  const { data: dashboard, isLoading } = useDashboard(travel.id)
  const { data: expenses } = useTravelExpenses(travel.id)

  const expenseCountByCategory = useMemo(
    () => getExpenseCountByCategory(expenses ?? []),
    [expenses],
  )

  if (isLoading) {
    return <BudgetSkeleton />
  }

  if (!dashboard) {
    return null
  }

  const { overall, categorySpending, currency } = dashboard

  const handleNavigateToCategories = () => {
    navigate({ to: '/travels/$travelId/categories', params: { travelId: travel.id } })
  }

  return (
    <YStack
      flex={1}
      gap="$lg"
      padding="$screenPaddingHorizontal"
      paddingTop="$2xl"
      data-testid="budget-breakdown-page"
    >
      {/* Page Header */}
      <SectionHeader
        title={t('budget.title')}
        action={isDesktop ? t('budget.manage') : undefined}
        onAction={isDesktop ? handleNavigateToCategories : undefined}
      />

      {/* Summary Card */}
      <SummaryCard
        totalBudget={overall.budget}
        totalSpent={overall.totalSpent}
        categories={categorySpending}
        currency={currency}
        locale={locale}
        t={t}
      />

      {/* Category Detail Cards */}
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
            onSetBudget={cat.budgetLimit === null ? handleNavigateToCategories : undefined}
          />
        ))}
      </YStack>
    </YStack>
  )
}
