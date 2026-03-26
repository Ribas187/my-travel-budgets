import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { XStack, YStack } from 'tamagui';
import { Heading } from '@repo/ui';
import { ExpenseList } from '@repo/features';
import { useTravelContext } from '@repo/features';

import { showToast } from '@/lib/toast';

export const Route = createFileRoute('/_authenticated/travels/$travelId/expenses')({
  component: ExpensesPage,
});

function ExpensesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { travelId } = Route.useParams();
  const { travel } = useTravelContext();

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
        <Heading level={2}>{travel.name}</Heading>
      </XStack>

      <ExpenseList
        onNavigateToCategories={() =>
          navigate({ to: '/travels/$travelId/categories', params: { travelId } })
        }
        onSuccess={(msg) => showToast(msg)}
      />
    </YStack>
  );
}
