import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { styled, XStack, YStack, View } from 'tamagui'
import { FAB, PrimaryButton, Heading, Body } from '@repo/ui'
import { useTravelDetail } from '@/hooks/useTravelDetail'
import { AddExpenseModal } from '@/features/expenses/AddExpenseModal'
import { ExpenseList } from '@/features/expenses/ExpenseList'

export const Route = createFileRoute('/_authenticated/travels/$travelId/')({
  component: TravelDetailPage,
})

const FABContainer = styled(View, {
  position: 'absolute' as const,
  bottom: 80,
  right: 24,
  zIndex: 100,
  // Show only on mobile/tablet — hide on desktop where we show inline button
  $gtTablet: {
    display: 'none',
  },
})

function TravelDetailPage() {
  const { t } = useTranslation()
  const { travelId } = Route.useParams()
  const { data: travel, isLoading } = useTravelDetail(travelId)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)

  if (isLoading) {
    return (
      <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
        <Body size="secondary">{t('common.loading')}</Body>
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

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
        <Heading level={2}>{travel.name}</Heading>
        {/* Desktop: show Add Expense button inline — hidden on mobile/tablet */}
        <View display="none" $gtTablet={{ display: 'flex' }}>
          <PrimaryButton
            label={t('expense.add')}
            onPress={() => setAddExpenseOpen(true)}
          />
        </View>
      </XStack>

      {/* Expense list */}
      <ExpenseList travel={travel} />

      {/* Mobile: FAB */}
      <FABContainer>
        <FAB
          onPress={() => setAddExpenseOpen(true)}
          accessibilityLabel={t('expense.add')}
        />
      </FABContainer>

      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        travel={travel}
      />
    </YStack>
  )
}
