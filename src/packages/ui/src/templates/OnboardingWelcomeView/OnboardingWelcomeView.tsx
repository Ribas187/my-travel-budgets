import { useState } from 'react';
import { styled, YStack, Text, View } from 'tamagui';
import { PrimaryButton } from '../../atoms';
import { FormInput } from '../../atoms';

export interface OnboardingWelcomeViewProps {
  title: string;
  subtitle: string;
  nameLabel?: string;
  namePlaceholder?: string;
  getStartedLabel: string;
  skipLabel: string;
  showNameInput: boolean;
  saving?: boolean;
  onNext: (name?: string) => void;
  onSkip: () => void;
}

const Title = styled(Text, {
  name: 'OnboardingWelcomeTitle',
  fontFamily: '$heading',
  fontSize: 28,
  fontWeight: '700',
  color: '$textPrimary',
  textAlign: 'center',
});

const Subtitle = styled(Text, {
  name: 'OnboardingWelcomeSubtitle',
  fontFamily: '$body',
  fontSize: 16,
  color: '$textSecondary',
  textAlign: 'center',
  lineHeight: 24,
});

const SkipButton = styled(Text, {
  name: 'SkipButton',
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  color: '$textTertiary',
  textAlign: 'center',
  cursor: 'pointer',
  pressStyle: { opacity: 0.7 },
});

export function OnboardingWelcomeView({
  title,
  subtitle,
  nameLabel,
  namePlaceholder,
  getStartedLabel,
  skipLabel,
  showNameInput,
  saving = false,
  onNext,
  onSkip,
}: OnboardingWelcomeViewProps) {
  const [nameValue, setNameValue] = useState('');

  const handleGetStarted = () => {
    if (showNameInput && nameValue.trim()) {
      onNext(nameValue.trim());
    } else {
      onNext();
    }
  };

  return (
    <YStack
      flex={1}
      padding="$xl"
      gap="$xl"
      justifyContent="center"
      alignItems="center"
      testID="onboarding-welcome-view"
    >
      <YStack gap="$md" alignItems="center" maxWidth={400} width="100%">
        <Title testID="welcome-title">
          {title}
        </Title>
        <Subtitle testID="welcome-subtitle">
          {subtitle}
        </Subtitle>
      </YStack>

      {showNameInput && (
        <YStack gap="$sm" width="100%" maxWidth={400}>
          {nameLabel && (
            <Text
              fontFamily="$body"
              fontSize={14}
              fontWeight="500"
              color="$textSecondary"
            >
              {nameLabel}
            </Text>
          )}
          <FormInput
            testID="name-input"
            value={nameValue}
            onChangeText={setNameValue}
            placeholder={namePlaceholder ?? nameLabel ?? ''}
            placeholderTextColor="$textTertiary"
            aria-label={nameLabel ?? ''}
          />
        </YStack>
      )}

      <YStack gap="$md" width="100%" maxWidth={400}>
        <View testID="get-started-button">
          <PrimaryButton
            label={getStartedLabel}
            onPress={handleGetStarted}
            loading={saving}
            disabled={saving}
          />
        </View>
        <SkipButton
          testID="skip-button"
          onPress={onSkip}
          role="button"
          aria-label={skipLabel}
        >
          {skipLabel}
        </SkipButton>
      </YStack>
    </YStack>
  );
}
