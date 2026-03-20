import { styled, XStack, YStack, Text, View } from 'tamagui'

const amountTextStyle = {
  fontFamily: '$heading',
  fontSize: 40,
  fontWeight: '700',
  letterSpacing: -1,

  $gtMobile: {
    fontSize: 56,
    letterSpacing: -1.68,
  },
} as const

const CurrencySymbol = styled(Text, {
  ...amountTextStyle,
  color: '$textTertiary',
})

const IntegerPart = styled(Text, {
  ...amountTextStyle,
  color: '$textPrimary',
})

const DecimalPart = styled(Text, {
  ...amountTextStyle,
  color: '$stone',
})

const CursorBar = styled(View, {
  width: 80,
  height: 3,
  borderRadius: 2,
  backgroundColor: '$brandPrimary',
})

const HintLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '500',
  lineHeight: 20,
  color: '$textTertiary',
})

interface AmountInputProps {
  value: string
  currencySymbol: string
  hint?: string
  onPress?: () => void
}

export function AmountInput({ value, currencySymbol, hint, onPress }: AmountInputProps) {
  const parts = value.split('.')
  const integerPart = parts[0] || '0'
  const decimalPart = parts[1] !== undefined ? `.${parts[1]}` : '.00'

  return (
    <YStack alignItems="center" gap="$sm" onPress={onPress}>
      {hint && <HintLabel>{hint}</HintLabel>}
      <XStack alignItems="baseline">
        <CurrencySymbol>{currencySymbol}</CurrencySymbol>
        <IntegerPart>{integerPart}</IntegerPart>
        <DecimalPart>{decimalPart}</DecimalPart>
      </XStack>
      <CursorBar />
    </YStack>
  )
}
