import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { XStack, YStack } from 'tamagui'
import { Heading } from '@repo/ui'
import { useTravelContext } from '@/contexts/TravelContext'
import { ExpenseList } from '@/features/expenses/ExpenseList'

export const Route = createFileRoute(
  '/_authenticated/travels/$travelId/expenses',
)({
  component: ExpensesPage,
})

function ExpensesPage() {
  const { t } = useTranslation()
  const { travel } = useTravelContext()

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
        <Heading level={2}>{travel.name}</Heading>
      </XStack>

      <ExpenseList travel={travel} />
    </YStack>
  )
}
