import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { XStack, YStack, Text, View } from 'tamagui'
import { StatCard, InsightCard, AvatarChip, Heading, Body } from '@repo/ui'
import type { MemberSpending } from '@repo/api-client'
import { useTravelContext } from '@/contexts/TravelContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useTravelExpenses } from '@/hooks/useTravelExpenses'
import { computeTripInsights } from './computeTripInsights'

const AVATAR_COLORS = [
  '#FF6B35', '#0EA5E9', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F59E0B', '#EF4444', '#6366F1',
]

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateRange(startDate: string, endDate: string, locale: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const start = new Intl.DateTimeFormat(locale, opts).format(new Date(startDate))
  const end = new Intl.DateTimeFormat(locale, { ...opts, year: 'numeric' }).format(new Date(endDate))
  return `${start} – ${end}`
}

function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'))
}

function getDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

export function TripSummaryPage() {
  const { t, i18n } = useTranslation()
  const { travel } = useTravelContext()
  const locale = i18n.language

  const { data: dashboard } = useDashboard(travel.id)
  const { data: expenses } = useTravelExpenses(travel.id)

  const isComplete = useMemo(() => new Date(travel.endDate) < new Date(), [travel.endDate])
  const dayCount = useMemo(() => getDayCount(travel.startDate, travel.endDate), [travel.startDate, travel.endDate])
  const dateRange = useMemo(() => formatDateRange(travel.startDate, travel.endDate, locale), [travel.startDate, travel.endDate, locale])

  const insights = useMemo(() => {
    if (!dashboard || !expenses) return []
    return computeTripInsights(dashboard, expenses, {
      formatAmount: (amount) => formatCurrency(amount, travel.currency, locale),
      formatDate: (dateStr) => formatDate(dateStr, locale),
      t,
    })
  }, [dashboard, expenses, travel.currency, locale, t])

  const memberSpendingMap = useMemo(() => {
    if (!dashboard) return new Map<string, MemberSpending>()
    const map = new Map<string, MemberSpending>()
    for (const ms of dashboard.memberSpending) {
      map.set(ms.memberId, ms)
    }
    return map
  }, [dashboard])

  if (!dashboard) return null

  const { overall } = dashboard
  const remaining = overall.budget - overall.totalSpent
  const isUnderBudget = remaining >= 0
  const budgetDiff = Math.abs(remaining)
  const budgetUsed = overall.budget > 0
    ? Math.round((overall.totalSpent / overall.budget) * 100)
    : 0
  const avgPerDay = overall.totalSpent / Math.max(1, dayCount)

  return (
    <YStack
      flex={1}
      padding="$screenPaddingHorizontal"
      paddingTop="$2xl"
      gap="$xl"
      data-testid="trip-summary-page"
    >
      {/* Hero Section */}
      <YStack alignItems="center" gap="$sm" data-testid="trip-hero">
        {isComplete && (
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="700"
            letterSpacing={1}
            color="$teal500"
            textTransform="uppercase"
            data-testid="complete-badge"
          >
            {t('summary.tripComplete')}
          </Text>
        )}
        <Heading level={2} textAlign="center">{travel.name}</Heading>
        <Body size="secondary" color="$textTertiary" textAlign="center">
          {dateRange} · {t('summary.days', { count: dayCount })} · {t('summary.travelers', { count: travel.members.length })}
        </Body>
      </YStack>

      {/* 2-column stat row: Total Spent, Under/Over Budget */}
      <XStack gap="$md" data-testid="stat-row-2">
        <YStack flex={1}>
          <StatCard
            label={t('summary.totalSpent')}
            value={formatCurrency(overall.totalSpent, travel.currency, locale)}
          />
        </YStack>
        <YStack flex={1}>
          <StatCard
            label={isUnderBudget ? t('summary.underBudget') : t('summary.overBudget')}
            value={formatCurrency(budgetDiff, travel.currency, locale)}
            valueColor={isUnderBudget ? '$teal500' : '$coral500'}
          />
        </YStack>
      </XStack>

      {/* 3-column stat row: Avg/Day, Expenses, Budget Used */}
      <XStack gap="$md" data-testid="stat-row-3">
        <YStack flex={1}>
          <StatCard
            label={t('summary.avgPerDay')}
            value={formatCurrency(avgPerDay, travel.currency, locale)}
          />
        </YStack>
        <YStack flex={1}>
          <StatCard
            label={t('summary.totalExpenses')}
            value={String(expenses?.length ?? 0)}
          />
        </YStack>
        <YStack flex={1}>
          <StatCard
            label={t('summary.budgetUsed')}
            value={`${budgetUsed}%`}
          />
        </YStack>
      </XStack>

      {/* Insights Section */}
      {insights.length > 0 && (
        <YStack gap="$md">
          <Heading level={4}>{t('summary.insights')}</Heading>
          {insights.map((insight) => (
            <InsightCard
              key={insight.type}
              title={insight.title}
              description={insight.description}
              icon={insight.icon}
              iconBackground={insight.iconBackground}
            />
          ))}
        </YStack>
      )}

      {/* Per Person Section */}
      <YStack gap="$md" data-testid="per-person-section">
        <Heading level={4}>{t('summary.perPerson')}</Heading>
        {travel.members.map((member, index) => {
          const displayName = member.user?.name ?? member.guestName ?? member.user?.email ?? ''
          const initial = displayName.charAt(0).toUpperCase()
          const spending = memberSpendingMap.get(member.id)

          return (
            <XStack
              key={member.id}
              alignItems="center"
              paddingVertical="$md"
              gap="$md"
              data-testid="per-person-row"
            >
              <XStack flex={1} alignItems="center" gap="$md">
                <AvatarChip
                  name={displayName}
                  initial={initial}
                  avatarColor={AVATAR_COLORS[index % AVATAR_COLORS.length]}
                />
              </XStack>
              <YStack alignItems="flex-end">
                <Text fontFamily="$body" fontSize={16} fontWeight="700" color="$textPrimary">
                  {formatCurrency(spending?.totalSpent ?? 0, travel.currency, locale)}
                </Text>
              </YStack>
            </XStack>
          )
        })}
      </YStack>
    </YStack>
  )
}
