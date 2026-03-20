import { styled, XStack, Text } from 'tamagui'

const BannerFrame = styled(XStack, {
  alignItems: 'center',
  gap: '$sm',
  borderRadius: '$xl',
  paddingVertical: 14,
  paddingHorizontal: '$lg',

  variants: {
    severity: {
      warning: {
        backgroundColor: '$statusWarningBackground',
      },
      danger: {
        backgroundColor: '$statusDangerBackground',
      },
    },
  } as const,
})

const IconText = styled(Text, {
  fontSize: 16,

  variants: {
    severity: {
      warning: {
        color: '$statusWarningText',
      },
      danger: {
        color: '$statusDanger',
      },
    },
  } as const,
})

const BannerText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  lineHeight: 20,
  flex: 1,

  variants: {
    severity: {
      warning: {
        color: '$statusWarningText',
      },
      danger: {
        color: '$statusDanger',
      },
    },
  } as const,
})

interface BudgetImpactBannerProps {
  message: string
  percentageAfter: number
}

export function BudgetImpactBanner({ message, percentageAfter }: BudgetImpactBannerProps) {
  const severity = percentageAfter >= 100 ? 'danger' : 'warning'

  return (
    <BannerFrame severity={severity} role="alert">
      <IconText severity={severity}>⚠</IconText>
      <BannerText severity={severity}>{message}</BannerText>
    </BannerFrame>
  )
}
