import { type ReactNode } from 'react'
import { styled, XStack, YStack, View, Text } from 'tamagui'
import { getBudgetStatusColor } from './budgetStatus'

const CardFrame = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  borderWidth: 1,
  borderColor: '$borderDefault',
  padding: '$lg',
  gap: '$md',
})

const HeaderRow = styled(XStack, {
  alignItems: 'center',
  gap: '$md',
})

const IconContainer = styled(View, {
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
})

const HeaderContent = styled(YStack, {
  flex: 1,
  gap: 2,
})

const TitleRow = styled(XStack, {
  justifyContent: 'space-between',
  alignItems: 'center',
})

const NameText = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  lineHeight: 22,
  color: '$textPrimary',
})

const PercentageText = styled(Text, {
  fontFamily: '$heading',
  fontSize: 20,
  fontWeight: '700',
  color: '$textPrimary',
})

const MetaText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  lineHeight: 18,
  color: '$textTertiary',
})

const ProgressTrack = styled(View, {
  height: 6,
  borderRadius: 3,
  backgroundColor: '$sand',
  overflow: 'hidden',
})

const ProgressBar = styled(View, {
  height: 6,
  borderRadius: 3,
})

const PacingText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  lineHeight: 20,
})

const SetBudgetButton = styled(XStack, {
  cursor: 'pointer',
  paddingVertical: '$sm',
})

const SetBudgetText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  lineHeight: 20,
  color: '$brandPrimary',
})

interface CategoryDetailCardProps {
  name: string
  icon: ReactNode
  iconColor: string
  iconBackground: string
  spent: number
  budget: number | null
  expenseCount: number
  currency: string
  locale: string
  onSetBudget?: () => void
}

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CategoryDetailCard({
  name,
  icon,
  iconColor,
  iconBackground,
  spent,
  budget,
  expenseCount,
  currency,
  locale,
  onSetBudget,
}: CategoryDetailCardProps) {
  const percentage = budget && budget > 0 ? Math.round((spent / budget) * 100) : 0
  const progressWidth = Math.min(percentage, 100)
  const progressColor = getBudgetStatusColor(percentage)

  const isOverBudget = budget !== null && budget > 0 && spent >= budget
  const overAmount = isOverBudget ? spent - budget : 0

  return (
    <CardFrame data-testid="category-detail-card">
      <HeaderRow>
        <IconContainer backgroundColor={iconBackground}>
          <Text color={iconColor} fontSize={20}>{icon}</Text>
        </IconContainer>
        <HeaderContent>
          <TitleRow>
            <NameText>{name}</NameText>
            {budget !== null && budget > 0 && (
              <PercentageText color={progressColor}>
                {percentage}%
              </PercentageText>
            )}
          </TitleRow>
          <MetaText>
            {expenseCount} expenses · {formatAmount(spent, currency, locale)}
            {budget !== null && budget > 0 && ` / ${formatAmount(budget, currency, locale)}`}
          </MetaText>
        </HeaderContent>
      </HeaderRow>

      {budget !== null && budget > 0 && (
        <ProgressTrack>
          <ProgressBar
            backgroundColor={progressColor}
            width={`${progressWidth}%`}
            data-testid="progress-bar"
          />
        </ProgressTrack>
      )}

      {budget !== null && budget > 0 && (
        <PacingText
          color={progressColor}
          data-testid="pacing-text"
        >
          {isOverBudget
            ? `Over budget by ${formatAmount(overAmount, currency, locale)}`
            : 'On track'}
        </PacingText>
      )}

      {budget === null && onSetBudget && (
        <SetBudgetButton
          onPress={onSetBudget}
          role="button"
          data-testid="set-budget-cta"
        >
          <SetBudgetText>Set a budget</SetBudgetText>
        </SetBudgetButton>
      )}
    </CardFrame>
  )
}
