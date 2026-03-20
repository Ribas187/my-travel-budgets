import { type ReactNode } from 'react'
import { styled, XStack, YStack, Text } from 'tamagui'

const RowFrame = styled(XStack, {
  alignItems: 'center',
  gap: '$iconTextGap',
  paddingVertical: '$listItemPaddingVertical',
  paddingHorizontal: '$listItemPaddingHorizontal',
})

const IconContainer = styled(XStack, {
  width: 44,
  height: 44,
  borderRadius: '$xl',
  alignItems: 'center',
  justifyContent: 'center',
})

const TitleText = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  lineHeight: 22,
  color: '$textPrimary',
})

const MetadataText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  lineHeight: 18,
  color: '$textTertiary',
})

const AmountText = styled(Text, {
  fontFamily: '$body',
  fontSize: 16,
  fontWeight: '700',
  color: '$textPrimary',
  textAlign: 'right',
})

interface ExpenseRowProps {
  title: string
  category: string
  time: string
  paidBy: string
  amount: string
  icon?: ReactNode
  iconBackgroundColor?: string
}

export function ExpenseRow({
  title,
  category,
  time,
  paidBy,
  amount,
  icon,
  iconBackgroundColor,
}: ExpenseRowProps) {
  return (
    <RowFrame>
      <IconContainer backgroundColor={iconBackgroundColor}>
        {icon}
      </IconContainer>
      <YStack flex={1} gap={2}>
        <TitleText numberOfLines={1}>{title}</TitleText>
        <MetadataText numberOfLines={1}>
          {category} · {time} · {paidBy}
        </MetadataText>
      </YStack>
      <AmountText>{amount}</AmountText>
    </RowFrame>
  )
}
