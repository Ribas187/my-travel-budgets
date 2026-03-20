import { styled, XStack, Text } from 'tamagui'

const HeaderFrame = styled(XStack, {
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: '$sm',
  paddingHorizontal: '$listItemPaddingHorizontal',
})

const DateText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '700',
  lineHeight: 18,
  color: '$textTertiary',
  textTransform: 'uppercase',
  letterSpacing: 0.52,
})

const TotalText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '700',
  lineHeight: 18,
  color: '$textPrimary',
})

interface DayGroupHeaderProps {
  label: string
  total: string
}

export function DayGroupHeader({ label, total }: DayGroupHeaderProps) {
  return (
    <HeaderFrame>
      <DateText>{label}</DateText>
      <TotalText>{total}</TotalText>
    </HeaderFrame>
  )
}
