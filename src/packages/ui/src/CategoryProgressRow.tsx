import { type ReactNode } from 'react'
import { styled, XStack, YStack, View, Text } from 'tamagui'
import { getBudgetStatusColor } from './budgetStatus'

const RowFrame = styled(XStack, {
  alignItems: 'center',
  gap: '$md',
  paddingVertical: '$md',
})

const IconContainer = styled(View, {
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
})

const ContentColumn = styled(YStack, {
  flex: 1,
  gap: '$xs',
})

const TopRow = styled(XStack, {
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

const AmountText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '700',
  lineHeight: 20,
  color: '$textPrimary',
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

interface CategoryProgressRowProps {
  name: string
  icon: ReactNode
  iconColor: string
  iconBackground: string
  spent: number
  budget: number | null
  currency: string
  locale: string
}

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CategoryProgressRow({
  name,
  icon,
  iconColor,
  iconBackground,
  spent,
  budget,
  currency,
  locale,
}: CategoryProgressRowProps) {
  const percentage = budget && budget > 0 ? (spent / budget) * 100 : 0
  const progressWidth = Math.min(percentage, 100)
  const progressColor = getBudgetStatusColor(percentage)

  const amountLabel = budget
    ? `${formatAmount(spent, currency, locale)} / ${formatAmount(budget, currency, locale)}`
    : formatAmount(spent, currency, locale)

  return (
    <RowFrame data-testid="category-progress-row">
      <IconContainer backgroundColor={iconBackground}>
        <Text color={iconColor} fontSize={20}>{icon}</Text>
      </IconContainer>
      <ContentColumn>
        <TopRow>
          <NameText>{name}</NameText>
          <AmountText>{amountLabel}</AmountText>
        </TopRow>
        {budget !== null && budget > 0 && (
          <ProgressTrack data-testid="progress-track">
            <ProgressBar
              backgroundColor={progressColor}
              width={`${progressWidth}%`}
              data-testid="progress-bar"
            />
          </ProgressTrack>
        )}
      </ContentColumn>
    </RowFrame>
  )
}
