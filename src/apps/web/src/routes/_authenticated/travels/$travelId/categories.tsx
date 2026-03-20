import { createFileRoute } from '@tanstack/react-router'
import { YStack } from 'tamagui'
import { useTravelContext } from '@/contexts/TravelContext'
import { CategoriesPage } from '@/features/categories/CategoriesPage'

export const Route = createFileRoute(
  '/_authenticated/travels/$travelId/categories',
)({
  component: CategoriesRoute,
})

function CategoriesRoute() {
  const { travel, isOwner } = useTravelContext()

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <CategoriesPage travel={travel} isOwner={isOwner} />
    </YStack>
  )
}
