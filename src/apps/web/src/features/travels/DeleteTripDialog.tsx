import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View } from 'tamagui';
import { PrimaryButton, Body, Heading } from '@repo/ui';

interface DeleteTripDialogProps {
  open: boolean;
  tripName: string;
  expenseCount: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
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
});

const DialogCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  padding: '$cardPadding',
  width: '100%',
  maxWidth: 400,
  gap: '$lg',
});

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
});

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
});

export function DeleteTripDialog({
  open,
  tripName,
  expenseCount,
  loading,
  onConfirm,
  onCancel,
}: DeleteTripDialogProps) {
  const { t } = useTranslation();

  const handleOverlayPress = useCallback(() => {
    if (!loading) onCancel();
  }, [loading, onCancel]);

  if (!open) return null;

  return (
    <Overlay onPress={handleOverlayPress} testID="delete-trip-overlay">
      <DialogCard
        onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}
        testID="delete-trip-dialog"
        role="alertdialog"
        aria-label={t('travel.deleteConfirmTitle')}
      >
        <Heading level={3}>{t('travel.deleteConfirmTitle')}</Heading>
        <Body size="primary" testID="delete-trip-message">
          {t('travel.deleteConfirmMessage', {
            name: tripName,
            count: expenseCount,
          })}
        </Body>
        <Body size="secondary" color="$textTertiary">
          {t('travel.deleteWarning')}
        </Body>
        <XStack gap="$md" justifyContent="flex-end">
          <CancelButton
            onPress={handleOverlayPress}
            role="button"
            aria-label={t('common.cancel')}
            testID="delete-trip-cancel"
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
            testID="delete-trip-confirm"
          >
            <Text fontFamily="$body" fontWeight="600" color="$white">
              {loading ? t('common.loading') : t('common.delete')}
            </Text>
          </DangerButton>
        </XStack>
      </DialogCard>
    </Overlay>
  );
}
