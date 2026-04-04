import { useTranslation } from 'react-i18next';
import { styled, YStack, Text, View } from 'tamagui';
import { PrimaryButton } from '../../atoms';
import { OnboardingProgressBar } from '../../molecules/OnboardingProgressBar';

interface OnboardingReadyViewProps {
  tripName: string;
  categoryCount: number;
  onAddExpense: () => void;
  onInviteMembers: () => void;
  onGoToDashboard: () => void;
  onSkip: () => void;
}

const Title = styled(Text, {
  name: 'OnboardingReadyTitle',
  fontFamily: '$heading',
  fontSize: 28,
  fontWeight: '700',
  color: '$textPrimary',
  textAlign: 'center',
});

const CelebrationEmoji = styled(Text, {
  name: 'CelebrationEmoji',
  fontSize: 64,
  textAlign: 'center',
});

const Summary = styled(Text, {
  name: 'OnboardingReadySummary',
  fontFamily: '$body',
  fontSize: 16,
  color: '$textSecondary',
  textAlign: 'center',
  lineHeight: 24,
});

const SecondaryActionButton = styled(View, {
  name: 'SecondaryActionButton',
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$2xl',
  paddingVertical: '$md',
  paddingHorizontal: '$2xl',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pressStyle: { opacity: 0.85 },
  width: '100%',
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

export function OnboardingReadyView({
  tripName,
  categoryCount,
  onAddExpense,
  onInviteMembers,
  onGoToDashboard,
  onSkip,
}: OnboardingReadyViewProps) {
  const { t } = useTranslation();

  return (
    <YStack
      flex={1}
      padding="$xl"
      gap="$xl"
      justifyContent="center"
      alignItems="center"
      testID="onboarding-ready-view"
    >
      <OnboardingProgressBar currentStep={4} totalSteps={4} />

      <CelebrationEmoji>{'🎉'}</CelebrationEmoji>

      <YStack gap="$md" alignItems="center" maxWidth={400} width="100%">
        <Title testID="ready-title">
          {t('onboarding.ready.title')}
        </Title>
        <Summary testID="ready-summary">
          {t('onboarding.ready.summary', {
            tripName,
            count: categoryCount,
          })}
        </Summary>
      </YStack>

      <YStack gap="$md" width="100%" maxWidth={400}>
        <View testID="add-expense-button">
          <PrimaryButton
            label={t('onboarding.ready.addExpense')}
            onPress={onAddExpense}
          />
        </View>

        <SecondaryActionButton
          testID="invite-members-button"
          onPress={onInviteMembers}
          role="button"
          aria-label={t('onboarding.ready.inviteMembers')}
        >
          <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
            {t('onboarding.ready.inviteMembers')}
          </Text>
        </SecondaryActionButton>

        <SecondaryActionButton
          testID="go-to-dashboard-button"
          onPress={onGoToDashboard}
          role="button"
          aria-label={t('onboarding.ready.goToDashboard')}
        >
          <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
            {t('onboarding.ready.goToDashboard')}
          </Text>
        </SecondaryActionButton>
      </YStack>

      <SkipButton
        testID="skip-button"
        onPress={onSkip}
        role="button"
        aria-label={t('onboarding.welcome.skip')}
      >
        {t('onboarding.welcome.skip')}
      </SkipButton>
    </YStack>
  );
}
