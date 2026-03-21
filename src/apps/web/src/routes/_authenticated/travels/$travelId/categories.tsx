import { useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import { BackHeader } from '@repo/ui';

import { useTravelContext } from '@/contexts/TravelContext';
import { CategoriesPage } from '@/features/categories/CategoriesPage';

export const Route = createFileRoute('/_authenticated/travels/$travelId/categories')({
  component: CategoriesRoute,
});

function CategoriesRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { travelId } = Route.useParams();
  const { travel, isOwner } = useTravelContext();

  const handleBack = useCallback(() => {
    navigate({ to: '/travels/$travelId', params: { travelId } });
  }, [navigate, travelId]);

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <BackHeader
        title={travel.name}
        onBack={handleBack}
        accessibilityLabel={t('common.backTo', { name: travel.name })}
      />
      <CategoriesPage travel={travel} isOwner={isOwner} />
    </YStack>
  );
}
