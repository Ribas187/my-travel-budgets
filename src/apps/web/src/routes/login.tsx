import { createFileRoute } from '@tanstack/react-router'
import { YStack, Text } from 'tamagui'
import { Heading } from '@repo/ui'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$2xl">
      <Heading level={1}>My Travel Budgets</Heading>
      <Text fontFamily="$body" color="$textSecondary" marginTop="$md">
        Login page placeholder
      </Text>
    </YStack>
  )
}
