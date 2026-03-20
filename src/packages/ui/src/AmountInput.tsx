import { styled, XStack, YStack, Text, View } from 'tamagui'

const CurrencySymbol = styled(Text, {
  fontFamily: '$heading',
  fontSize: 56,
  fontWeight: '700',
  letterSpacing: -1.68,
  color: '$textTertiary',
})

const IntegerPart = styled(Text, {
  fontFamily: '$heading',
  fontSize: 56,
  fontWeight: '700',
  letterSpacing: -1.68,
  color: '$textPrimary',
})

const DecimalPart = styled(Text, {
  fontFamily: '$heading',
  fontSize: 56,
  fontWeight: '700',
  letterSpacing: -1.68,
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
