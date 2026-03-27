import { useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text } from 'tamagui';
import { Heading } from '@repo/ui';
import type { CreateTravelInput } from '@repo/api-client';
import { useCreateTravel } from '@repo/api-client';
import { TripForm } from '@repo/features';

import { showToast } from '@/lib/toast';

export const Route = createFileRoute('/_authenticated/travels/new')({
  component: NewTripPage,
});

const CloseButton = styled(Text, {
  fontSize: 24,
  color: '$textTertiary',
  cursor: 'pointer',
  padding: '$xs',
});

function NewTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createTravel = useCreateTravel();

  const handleSave = useCallback(
    (data: CreateTravelInput) => {
      createTravel.mutate(data, {
        onSuccess: (travel) => {
          showToast(t('travel.created'));
          navigate({ to: '/travels/$travelId', params: { travelId: travel.id } });
        },
      });
    },
    [createTravel, navigate, t],
  );

  const handleClose = useCallback(() => {
    navigate({ to: '/travels' });
  }, [navigate]);

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
        <Heading level={2}>{t('travel.newTrip')}</Heading>
        <CloseButton
          onPress={handleClose}
          role="button"
          aria-label={t('common.close')}
          testID="close-new-trip"
        >
          ✕
        </CloseButton>
      </XStack>

      <TripForm saving={createTravel.isPending} onSave={handleSave} onSuccess={(msg) => showToast(msg)} />
    </YStack>
  );
}
