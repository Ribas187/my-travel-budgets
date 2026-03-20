import { YStack, Text, styled } from 'tamagui'
import { getBudgetStatusColor } from './budgetStatus'

const RingContainer = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
})

const InnerLabel = styled(YStack, {
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
})

const OverlineText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  letterSpacing: 0.52,
  textTransform: 'uppercase',
  color: '$textTertiary',
})

const AmountText = styled(Text, {
  fontFamily: '$heading',
  fontSize: 36,
  fontWeight: '700',
  letterSpacing: -0.72,
  color: '$textPrimary',
})

const SubtitleText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  lineHeight: 18,
})

interface BudgetRingProps {
  total: number
  spent: number
  currency: string
  locale: string
  size?: number
  strokeWidth?: number
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function BudgetRing({
  total,
  spent,
  currency,
  locale,
  size = 180,
  strokeWidth = 12,
}: BudgetRingProps) {
  const percentage = total > 0 ? (spent / total) * 100 : 0
  const remaining = Math.max(0, total - spent)
  const progressColor = getBudgetStatusColor(percentage)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // Cap at 100% for the visual ring
  const progressRatio = Math.min(percentage / 100, 1)
  const strokeDashoffset = circumference * (1 - progressRatio)

  const center = size / 2

  return (
    <RingContainer
      width={size}
      height={size}
      data-testid="budget-ring"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#F0EDE8"
          strokeWidth={strokeWidth}
          data-testid="budget-ring-track"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          data-testid="budget-ring-progress"
        />
      </svg>
      <InnerLabel>
        <OverlineText>Remaining</OverlineText>
        <AmountText>{formatCurrency(remaining, currency, locale)}</AmountText>
        <SubtitleText color={progressColor}>
          {formatCurrency(spent, currency, locale)} spent
        </SubtitleText>
      </InnerLabel>
    </RingContainer>
  )
}
