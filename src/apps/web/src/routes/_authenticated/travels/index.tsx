import { createFileRoute } from '@tanstack/react-router'
import { YStack, Text } from 'tamagui'
import { Heading } from '@repo/ui'

export const Route = createFileRoute('/_authenticated/travels/')({
  component: TravelsPage,
})

function TravelsPage() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl">
      <Heading level={2}>My Travels</Heading>
      <Text fontFamily="$body" color="$textSecondary" marginTop="$md">
        Travels list placeholder
      </Text>
    </YStack>
  )
}
