import { useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import { BackHeader } from '@repo/ui';
import { CategoriesPage, useTravelContext } from '@repo/features';

import { showToast } from '@/lib/toast';

export const Route = createFileRoute('/_authenticated/travels/$travelId/categories')({
  component: CategoriesRoute,
});

function CategoriesRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { travelId } = Route.useParams();
  const { travel } = useTravelContext();

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
      <CategoriesPage
        onSuccess={(msg) => showToast(msg)}
        onError={(msg) => showToast(msg, 'error')}
      />
    </YStack>
  );
}
