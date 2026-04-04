import { useState } from 'react';
import { YStack, XStack } from 'tamagui';

import { Heading, Body, PrimaryButton, FormInput, FormLabel } from '../../atoms';

export interface OnboardingTripFormViewProps {
  title: string;
  subtitle: string;
  nextLabel: string;
  skipLabel: string;
  saving: boolean;
  onNext: (data: {
    name: string;
    description: string;
    currency: string;
    budget: number;
    startDate: string;
    endDate: string;
  }) => void;
  onSkip: () => void;
}

export function OnboardingTripFormView({
  title,
  subtitle,
  nextLabel,
  skipLabel,
  saving,
  onNext,
  onSkip,
}: OnboardingTripFormViewProps) {
  const [tripName, setTripName] = useState('');
  const [description, setDescription] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$6">
      <YStack alignItems="center" gap="$3">
        <Heading size="$8" textAlign="center">{title}</Heading>
        <Body textAlign="center" color="$gray11">{subtitle}</Body>
      </YStack>

      <YStack width="100%" maxWidth={400} gap="$3">
        <YStack gap="$2">
          <FormLabel>Trip Name</FormLabel>
          <FormInput
            placeholder="e.g. Summer in Europe"
            value={tripName}
            onChangeText={setTripName}
            testID="onboarding-trip-name"
          />
        </YStack>
        <YStack gap="$2">
          <FormLabel>Description</FormLabel>
          <FormInput
            placeholder="A brief description"
            value={description}
            onChangeText={setDescription}
            testID="onboarding-trip-description"
          />
        </YStack>
      </YStack>

      <XStack gap="$3" flexDirection="column" alignItems="center" width="100%" maxWidth={400}>
        <PrimaryButton
          width="100%"
          onPress={() =>
            onNext({
              name: tripName || 'My First Trip',
              description,
              currency: 'USD',
              budget: 1000,
              startDate: today,
              endDate: nextWeek,
            })
          }
          disabled={saving}
          testID="onboarding-trip-next"
        >
          {nextLabel}
        </PrimaryButton>
        <Body
          color="$gray10"
          pressStyle={{ opacity: 0.7 }}
          cursor="pointer"
          onPress={onSkip}
          textAlign="center"
          role="button"
          testID="onboarding-skip"
        >
          {skipLabel}
        </Body>
      </XStack>
    </YStack>
  );
}
