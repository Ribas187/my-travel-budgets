import { XStack, YStack } from 'tamagui';

import { Caption } from '../../atoms';

export interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export function OnboardingProgressBar({
  currentStep,
  totalSteps,
  stepLabel,
}: OnboardingProgressBarProps) {
  return (
    <YStack gap="$2" paddingHorizontal="$4">
      <Caption textAlign="center">{stepLabel}</Caption>
      <XStack gap="$1.5" justifyContent="center">
        {Array.from({ length: totalSteps }, (_, i) => (
          <YStack
            key={i}
            flex={1}
            height={4}
            borderRadius="$1"
            backgroundColor={i < currentStep ? '$brandPrimary' : '$gray5'}
          />
        ))}
      </XStack>
    </YStack>
  );
}
