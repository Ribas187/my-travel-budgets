import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, View, Text } from 'tamagui';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const StepDot = styled(View, {
  name: 'StepDot',
  height: 4,
  borderRadius: 2,
  flex: 1,

  variants: {
    active: {
      true: {
        backgroundColor: '$brandPrimary',
      },
      false: {
        backgroundColor: '$borderDefault',
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
});

const StepLabel = styled(Text, {
  name: 'StepLabel',
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  color: '$textTertiary',
  textAlign: 'center',
});

export function OnboardingProgressBar({
  currentStep,
  totalSteps,
}: OnboardingProgressBarProps) {
  const { t } = useTranslation();

  return (
    <YStack gap="$sm" testID="onboarding-progress-bar">
      <XStack gap="$xs">
        {Array.from({ length: totalSteps }, (_, i) => (
          <StepDot
            key={i}
            active={i < currentStep}
            testID={`progress-dot-${i + 1}`}
          />
        ))}
      </XStack>
      <StepLabel testID="progress-label">
        {t('onboarding.step', { current: currentStep, total: totalSteps })}
      </StepLabel>
    </YStack>
  );
}
