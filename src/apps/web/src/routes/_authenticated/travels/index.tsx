import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { styled, XStack, YStack, Text, Spinner } from 'tamagui';
import { Heading, Body, PrimaryButton } from '@repo/ui';
import type { Travel } from '@repo/api-client';
import { useTravels, useUserMe, useSetMainTravel } from '@repo/api-client';

export const Route = createFileRoute('/_authenticated/travels/')({
  component: TravelsPage,
});

// ---------------------------------------------------------------------------
// TravelCard
// ---------------------------------------------------------------------------

const CardFrame = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  borderWidth: 1,
  borderColor: '$borderDefault',
  padding: '$cardPadding',
  gap: '$sm',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.92,
    scale: 0.99,
  },
});

const ProgressBarTrack = styled(XStack, {
  height: 6,
  borderRadius: '$full',
  backgroundColor: '$sand',
  overflow: 'hidden',
});

interface TravelCardProps {
  travel: Travel;
  isMainTravel?: boolean;
  loading?: boolean;
  onToggleMain?: () => void;
  onPress: () => void;
}

function formatDateRange(startDate: string, endDate: string, locale: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Intl.DateTimeFormat(locale, opts).format(new Date(startDate));
  const end = new Intl.DateTimeFormat(locale, { ...opts, year: 'numeric' }).format(
    new Date(endDate),
  );
  return `${start} – ${end}`;
}

function formatBudget(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TravelCard({ travel, isMainTravel, loading, onToggleMain, onPress }: TravelCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const dateRange = formatDateRange(travel.startDate, travel.endDate, locale);
  const budgetFormatted = formatBudget(travel.budget, travel.currency, locale);

  // Budget progress — we don't have totalSpent from the list endpoint,
  // so we show the budget amount. Progress bar stays at 0 until dashboard data is available.
  const progress = 0;

  const handleStarPress = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (loading) return;
    onToggleMain?.();
  };

  return (
    <CardFrame
      onPress={onPress}
      role="button"
      aria-label={travel.name}
      testID={`travel-card-${travel.id}`}
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <Heading level={3} flex={1}>{travel.name}</Heading>
        {onToggleMain && (
          <XStack
            role="button"
            aria-label={isMainTravel ? t('travel.removeMainTravel') : t('travel.setMainTravel')}
            aria-disabled={loading}
            cursor={loading ? 'default' : 'pointer'}
            padding="$xs"
            onPress={handleStarPress}
            testID={`star-toggle-${travel.id}`}
            tabIndex={0}
            {...{
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStarPress(e);
                }
              },
            } as Record<string, unknown>}
          >
            {loading ? (
              <Spinner size="small" color="#9ca3af" data-testid="star-spinner" />
            ) : (
              <Star
                size={20}
                fill={isMainTravel ? 'currentColor' : 'none'}
                color={isMainTravel ? '#f59e0b' : '#9ca3af'}
                data-testid={isMainTravel ? 'star-filled' : 'star-outline'}
              />
            )}
          </XStack>
        )}
      </XStack>
      <Body size="secondary">{dateRange}</Body>
      <XStack justifyContent="space-between" alignItems="center" marginTop="$xs">
        <Body size="secondary">{budgetFormatted}</Body>
        <Text fontFamily="$body" fontSize={13} color="$textTertiary">
          {travel.currency}
        </Text>
      </XStack>
      <ProgressBarTrack>
        <XStack
          height="100%"
          width={`${Math.min(progress, 100)}%`}
          backgroundColor={
            progress >= 100 ? '$statusDanger' : progress >= 70 ? '$statusWarning' : '$statusSafe'
          }
          borderRadius="$full"
        />
      </ProgressBarTrack>
    </CardFrame>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

const SkeletonBox = styled(YStack, {
  backgroundColor: '$sand',
  borderRadius: '$sm',
  overflow: 'hidden',
});

const SkeletonCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  borderWidth: 1,
  borderColor: '$borderDefault',
  padding: '$cardPadding',
  gap: '$md',
});

function TravelCardSkeleton() {
  return (
    <SkeletonCard testID="travel-card-skeleton">
      <SkeletonBox height={24} width="60%" />
      <SkeletonBox height={16} width="45%" />
      <XStack justifyContent="space-between">
        <SkeletonBox height={16} width="30%" />
        <SkeletonBox height={16} width="15%" />
      </XStack>
      <SkeletonBox height={6} width="100%" borderRadius="$full" />
    </SkeletonCard>
  );
}

function TravelsSkeletonList() {
  return (
    <YStack gap="$lg" testID="travels-skeleton">
      <TravelCardSkeleton />
      <TravelCardSkeleton />
      <TravelCardSkeleton />
    </YStack>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  onCreateTrip: () => void;
}

function TravelsEmptyState({ onCreateTrip }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="$lg"
      padding="$2xl"
      testID="travels-empty-state"
    >
      <Text fontSize={48} role="img" aria-label="airplane">
        ✈️
      </Text>
      <Heading level={3}>{t('travel.emptyState')}</Heading>
      <PrimaryButton label={t('travel.emptyStateCta')} onPress={onCreateTrip} />
    </YStack>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

function TravelsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: travels, isLoading } = useTravels();
  const { data: user } = useUserMe();
  const setMainTravel = useSetMainTravel();

  const handleCreateTrip = () => {
    navigate({ to: '/travels/new' });
  };

  const handleTravelPress = (travelId: string) => {
    // Route will be created in a future task
    navigate({ to: `/travels/${travelId}` as string });
  };

  const handleToggleMain = (travelId: string) => {
    const newMainId = user?.mainTravelId === travelId ? null : travelId;
    setMainTravel.mutate(newMainId);
  };

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$2xl">
        <Heading level={2}>{t('travel.myTravels')}</Heading>
        {!isLoading && travels && travels.length > 0 && (
          <PrimaryButton label={t('travel.create')} onPress={handleCreateTrip} />
        )}
      </XStack>

      {isLoading ? (
        <TravelsSkeletonList />
      ) : !travels || travels.length === 0 ? (
        <TravelsEmptyState onCreateTrip={handleCreateTrip} />
      ) : (
        <YStack gap="$lg" testID="travels-list">
          {travels.map((travel) => (
            <TravelCard
              key={travel.id}
              travel={travel}
              isMainTravel={user?.mainTravelId === travel.id}
              loading={setMainTravel.isPending}
              onToggleMain={() => handleToggleMain(travel.id)}
              onPress={() => handleTravelPress(travel.id)}
            />
          ))}
        </YStack>
      )}
    </YStack>
  );
}
