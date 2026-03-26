import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View } from 'tamagui';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  testID?: string;
}

const Overlay = styled(View, {
  position: 'absolute' as const,
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
});

const DialogCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  padding: '$xl',
  gap: '$lg',
  maxWidth: 400,
  width: '90%',
});

export function ConfirmDialog({ open, message, confirmLabel, onConfirm, onCancel, loading, testID }: ConfirmDialogProps) {
  const { t } = useTranslation();
  const handleOverlayPress = useCallback(() => { if (!loading) onCancel(); }, [loading, onCancel]);

  if (!open) return null;

  return (
    <Overlay onPress={handleOverlayPress} data-testid={testID ?? 'confirm-dialog'}>
      <DialogCard onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
        <Text fontFamily="$body" fontSize={16} fontWeight="600" color="$textPrimary">{message}</Text>
        <XStack gap="$md" justifyContent="flex-end">
          <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$textTertiary" cursor="pointer" onPress={handleOverlayPress} paddingVertical="$sm" data-testid="confirm-cancel">
            {t('common.cancel')}
          </Text>
          <YStack backgroundColor="$coral500" paddingHorizontal="$lg" paddingVertical="$sm" borderRadius="$lg"
            cursor={loading ? 'default' : 'pointer'} opacity={loading ? 0.6 : 1}
            onPress={loading ? undefined : onConfirm} data-testid="confirm-action">
            <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$white">
              {confirmLabel ?? t('common.confirm')}
            </Text>
          </YStack>
        </XStack>
      </DialogCard>
    </Overlay>
  );
}
