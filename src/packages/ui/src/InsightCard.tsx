import { type ReactNode } from 'react'
import { styled, XStack, YStack, View, Text } from 'tamagui'

const CardFrame = styled(XStack, {
  backgroundColor: '$white',
  borderRadius: 14,
  borderWidth: 1,
  borderColor: '$borderDefault',
  padding: '$lg',
  alignItems: 'center',
  gap: 14,
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
  gap: 2,
})

const TitleText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '500',
  lineHeight: 20,
  color: '$textTertiary',
})

const DescriptionText = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  lineHeight: 22,
  color: '$textPrimary',
})

interface InsightCardProps {
  title: string
  description: string
  icon: ReactNode
  iconBackground: string
}

export function InsightCard({ title, description, icon, iconBackground }: InsightCardProps) {
  return (
    <CardFrame data-testid="insight-card">
      <IconContainer backgroundColor={iconBackground}>
        <Text fontSize={20}>{icon}</Text>
      </IconContainer>
      <ContentColumn>
        <TitleText>{title}</TitleText>
        <DescriptionText>{description}</DescriptionText>
      </ContentColumn>
    </CardFrame>
  )
}
