import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { YStack, Spinner } from 'tamagui'
import { Body } from '@repo/ui'
import { useTravelDetail } from '@/hooks/useTravelDetail'
import { useAuth } from '@/providers/AuthProvider'
import { CategoriesPage } from '@/features/categories/CategoriesPage'

export const Route = createFileRoute(
  '/_authenticated/travels/$travelId/categories',
)({
  component: CategoriesRoute,
})

function parseTokenUserId(token: string | null): string | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    return decoded.sub ?? decoded.userId ?? null
  } catch {
    return null
  }
}

function CategoriesRoute() {
  const { t } = useTranslation()
  const { travelId } = Route.useParams()
  const { data: travel, isLoading } = useTravelDetail(travelId)
  const { token } = useAuth()

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$brandPrimary" />
      </YStack>
    )
  }

  if (!travel) {
    return (
      <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
        <Body size="secondary">{t('common.error')}</Body>
      </YStack>
    )
  }

  const currentUserId = parseTokenUserId(token)
  const isOwner = travel.members.some(
    (m) => m.role === 'owner' && m.userId === currentUserId,
  )

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <CategoriesPage travel={travel} isOwner={isOwner} />
    </YStack>
  )
}
