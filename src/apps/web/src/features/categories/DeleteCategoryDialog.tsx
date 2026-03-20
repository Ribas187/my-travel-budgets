import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { styled, XStack, YStack, Text, View } from 'tamagui'
import { PrimaryButton, Body, Heading } from '@repo/ui'

interface DeleteCategoryDialogProps {
  open: boolean
  categoryName: string
  expenseCount: number
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

const Overlay = styled(View, {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  zIndex: 9000,
  justifyContent: 'center',
  alignItems: 'center',
})

const DialogCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  padding: '$cardPadding',
  width: '100%',
  maxWidth: 400,
  gap: '$lg',
})

const DangerButton = styled(View, {
  backgroundColor: '$statusDanger',
  borderRadius: '$lg',
  paddingVertical: '$md',
  paddingHorizontal: '$2xl',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  opacity: 1,
  pressStyle: {
    opacity: 0.85,
  },
})

const CancelButton = styled(View, {
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingVertical: '$md',
  paddingHorizontal: '$2xl',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.85,
  },
})

export function DeleteCategoryDialog({
  open,
  categoryName,
  expenseCount,
  loading,
  onConfirm,
  onCancel,
}: DeleteCategoryDialogProps) {
  const { t } = useTranslation()

  const handleOverlayPress = useCallback(() => {
    if (!loading) onCancel()
  }, [loading, onCancel])

  if (!open) return null

  return (
    <Overlay onPress={handleOverlayPress} testID="delete-category-overlay">
      <DialogCard
        onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}
        testID="delete-category-dialog"
      >
        <Heading level={3}>{t('category.deleteConfirmTitle')}</Heading>
        <Body size="primary" testID="delete-category-message">
          {t('category.deleteConfirmMessage', {
            count: expenseCount,
          })}
        </Body>
        <Body size="secondary" color="$textTertiary">
          {t('category.deleteWarning')}
        </Body>
        <XStack gap="$md" justifyContent="flex-end">
          <CancelButton
            onPress={handleOverlayPress}
            role="button"
            aria-label={t('common.cancel')}
            testID="delete-category-cancel"
          >
            <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
              {t('common.cancel')}
            </Text>
          </CancelButton>
          <DangerButton
            onPress={onConfirm}
            opacity={loading ? 0.6 : 1}
            role="button"
            aria-label={t('common.delete')}
            testID="delete-category-confirm"
          >
            <Text fontFamily="$body" fontWeight="600" color="$white">
              {loading ? t('common.loading') : t('common.delete')}
            </Text>
          </DangerButton>
        </XStack>
      </DialogCard>
    </Overlay>
  )
}
