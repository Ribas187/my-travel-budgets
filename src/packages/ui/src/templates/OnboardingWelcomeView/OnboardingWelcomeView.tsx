import { useState } from 'react';
import { YStack, XStack } from 'tamagui';

import { Heading, Body, PrimaryButton, FormInput, FormLabel } from '../../atoms';

export interface OnboardingWelcomeViewProps {
  title: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  getStartedLabel: string;
  skipLabel: string;
  showNameInput: boolean;
  saving: boolean;
  onNext: (name?: string) => void;
  onSkip: () => void;
}

export function OnboardingWelcomeView({
  title,
  subtitle,
  nameLabel,
  namePlaceholder,
  getStartedLabel,
  skipLabel,
  showNameInput,
  saving,
  onNext,
  onSkip,
}: OnboardingWelcomeViewProps) {
  const [name, setName] = useState('');

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$6">
      <YStack alignItems="center" gap="$3">
        <Heading size="$8" textAlign="center">{title}</Heading>
        <Body textAlign="center" color="$gray11">{subtitle}</Body>
      </YStack>

      {showNameInput && (
        <YStack width="100%" maxWidth={400} gap="$2">
          <FormLabel>{nameLabel}</FormLabel>
          <FormInput
            placeholder={namePlaceholder}
            value={name}
            onChangeText={setName}
            autoFocus
            testID="onboarding-name-input"
          />
        </YStack>
      )}

      <XStack gap="$3" flexDirection="column" alignItems="center" width="100%" maxWidth={400}>
        <PrimaryButton
          width="100%"
          onPress={() => onNext(showNameInput ? name : undefined)}
          disabled={saving}
          testID="onboarding-get-started"
        >
          {getStartedLabel}
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
