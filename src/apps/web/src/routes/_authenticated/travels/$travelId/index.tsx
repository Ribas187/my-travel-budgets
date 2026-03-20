import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { YStack } from 'tamagui'
import { Heading, Body } from '@repo/ui'
import { useTravelContext } from '@/contexts/TravelContext'

export const Route = createFileRoute('/_authenticated/travels/$travelId/')({
  component: DashboardPlaceholder,
})

function DashboardPlaceholder() {
  const { t } = useTranslation()
  const { travel } = useTravelContext()

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl" data-testid="dashboard-page">
      <Heading level={2}>{travel.name}</Heading>
      <Body size="secondary">{t('dashboard.title')}</Body>
    </YStack>
  )
}
