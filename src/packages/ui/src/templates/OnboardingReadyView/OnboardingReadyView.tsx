import { styled, YStack, Text, View } from 'tamagui';
import { PrimaryButton } from '../../atoms';

interface OnboardingReadyViewProps {
  title: string;
  subtitle: string;
  addExpenseLabel: string;
  inviteMembersLabel: string;
  goToDashboardLabel: string;
  completing?: boolean;
  tripName?: string;
  categoryCount?: number;
  onAddExpense: () => void;
  onInviteMembers: () => void;
  onGoToDashboard: () => void;
  onSkip?: () => void;
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


export { type OnboardingReadyViewProps };

export function OnboardingReadyView({
  title,
  subtitle,
  addExpenseLabel,
  inviteMembersLabel,
  goToDashboardLabel,
  completing = false,
  onAddExpense,
  onInviteMembers,
  onGoToDashboard,
}: OnboardingReadyViewProps) {
  return (
    <YStack
      flex={1}
      padding="$xl"
      gap="$xl"
      justifyContent="center"
      alignItems="center"
      testID="onboarding-ready-view"
    >
      <CelebrationEmoji>{'🎉'}</CelebrationEmoji>

      <YStack gap="$md" alignItems="center" maxWidth={400} width="100%">
        <Title testID="ready-title">
          {title}
        </Title>
        <Summary testID="ready-summary">
          {subtitle}
        </Summary>
      </YStack>

      <YStack gap="$md" width="100%" maxWidth={400}>
        <View testID="add-expense-button">
          <PrimaryButton
            label={addExpenseLabel}
            onPress={onAddExpense}
            loading={completing}
            disabled={completing}
          />
        </View>

        <SecondaryActionButton
          testID="invite-members-button"
          onPress={onInviteMembers}
          role="button"
          aria-label={inviteMembersLabel}
        >
          <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
            {inviteMembersLabel}
          </Text>
        </SecondaryActionButton>

        <SecondaryActionButton
          testID="go-to-dashboard-button"
          onPress={onGoToDashboard}
          role="button"
          aria-label={goToDashboardLabel}
        >
          <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
            {goToDashboardLabel}
          </Text>
        </SecondaryActionButton>
      </YStack>
    </YStack>
  );
}
