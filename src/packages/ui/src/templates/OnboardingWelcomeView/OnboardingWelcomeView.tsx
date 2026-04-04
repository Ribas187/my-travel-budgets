import { useTranslation } from 'react-i18next';
import { styled, YStack, Text, View } from 'tamagui';
import { PrimaryButton } from '../../atoms';
import { OnboardingProgressBar } from '../../molecules/OnboardingProgressBar';
import { FormInput } from '../../atoms';

interface OnboardingWelcomeViewProps {
  showNameInput: boolean;
  nameValue: string;
  onNameChange: (name: string) => void;
  onGetStarted: () => void;
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
  showNameInput,
  nameValue,
  onNameChange,
  onGetStarted,
  onSkip,
}: OnboardingWelcomeViewProps) {
  const { t } = useTranslation();

  return (
    <YStack
      flex={1}
      padding="$xl"
      gap="$xl"
      justifyContent="center"
      alignItems="center"
      testID="onboarding-welcome-view"
    >
      <OnboardingProgressBar currentStep={1} totalSteps={4} />

      <YStack gap="$md" alignItems="center" maxWidth={400} width="100%">
        <Title testID="welcome-title">
          {t('onboarding.welcome.title')}
        </Title>
        <Subtitle testID="welcome-subtitle">
          {t('onboarding.welcome.subtitle')}
        </Subtitle>
      </YStack>

      {showNameInput && (
        <YStack gap="$sm" width="100%" maxWidth={400}>
          <Text
            fontFamily="$body"
            fontSize={14}
            fontWeight="500"
            color="$textSecondary"
          >
            {t('onboarding.welcome.namePrompt')}
          </Text>
          <FormInput
            testID="name-input"
            value={nameValue}
            onChangeText={onNameChange}
            placeholder={t('onboarding.welcome.namePrompt')}
            placeholderTextColor="$textTertiary"
            aria-label={t('onboarding.welcome.namePrompt')}
          />
        </YStack>
      )}

      <YStack gap="$md" width="100%" maxWidth={400}>
        <View testID="get-started-button">
          <PrimaryButton
            label={t('onboarding.welcome.getStarted')}
            onPress={onGetStarted}
          />
        </View>
        <SkipButton
          testID="skip-button"
          onPress={onSkip}
          role="button"
          aria-label={t('onboarding.welcome.skip')}
        >
          {t('onboarding.welcome.skip')}
        </SkipButton>
      </YStack>
    </YStack>
  );
}
