import { useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text } from 'tamagui';
import { Heading } from '@repo/ui';
import type { CreateTravelInput } from '@repo/api-client';
import { useUpdateTravel, useDeleteTravel, useTravelExpenses } from '@repo/api-client';
import { TripForm, useTravelContext } from '@repo/features';

import { showToast } from '@/lib/toast';

export const Route = createFileRoute('/_authenticated/travels/$travelId/edit')({
  component: EditTripPage,
});

const CloseButton = styled(Text, {
  fontSize: 24,
  color: '$textTertiary',
  cursor: 'pointer',
  padding: '$xs',
});

function EditTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { travelId } = Route.useParams();
  const { travel } = useTravelContext();
  const { data: expenses } = useTravelExpenses(travelId);
  const updateTravel = useUpdateTravel(travelId);
  const deleteTravel = useDeleteTravel();

  const expenseCount = expenses?.length ?? 0;

  const handleSave = useCallback(
    (data: CreateTravelInput) => {
      updateTravel.mutate(data, {
        onSuccess: () => {
          showToast(t('travel.saved'));
          navigate({ to: '/travels/$travelId', params: { travelId } });
        },
      });
    },
    [updateTravel, navigate, travelId, t],
  );

  const handleDelete = useCallback(() => {
    deleteTravel.mutate(travelId, {
      onSuccess: () => {
        showToast(t('travel.deleted'));
        navigate({ to: '/travels' });
      },
    });
  }, [deleteTravel, travelId, navigate, t]);

  const handleClose = useCallback(() => {
    navigate({ to: '/travels/$travelId', params: { travelId } });
  }, [navigate, travelId]);

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
        <Heading level={2}>{t('travel.editTrip')}</Heading>
        <CloseButton
          onPress={handleClose}
          role="button"
          aria-label={t('common.close')}
          testID="close-edit-trip"
        >
          ✕
        </CloseButton>
      </XStack>

      <TripForm
        travel={travel}
        expenseCount={expenseCount}
        saving={updateTravel.isPending}
        deleting={deleteTravel.isPending}
        onSave={handleSave}
        onDelete={handleDelete}
        onSuccess={(msg) => showToast(msg)}
      />
    </YStack>
  );
}
