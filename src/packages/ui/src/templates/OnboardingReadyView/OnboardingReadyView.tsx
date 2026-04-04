import { YStack, XStack } from 'tamagui';

import { Heading, Body, PrimaryButton } from '../../atoms';

export interface OnboardingReadyViewProps {
  title: string;
  subtitle: string;
  addExpenseLabel: string;
  inviteMembersLabel: string;
  goToDashboardLabel: string;
  completing: boolean;
  onAddExpense: () => void;
  onInviteMembers: () => void;
  onGoToDashboard: () => void;
}

export function OnboardingReadyView({
  title,
  subtitle,
  addExpenseLabel,
  inviteMembersLabel,
  goToDashboardLabel,
  completing,
  onAddExpense,
  onInviteMembers,
  onGoToDashboard,
}: OnboardingReadyViewProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$6">
      <YStack alignItems="center" gap="$3">
        <Body fontSize={48}>🎉</Body>
        <Heading size="$8" textAlign="center">{title}</Heading>
        <Body textAlign="center" color="$gray11">{subtitle}</Body>
      </YStack>

      <XStack gap="$3" flexDirection="column" alignItems="center" width="100%" maxWidth={400}>
        <PrimaryButton
          width="100%"
          onPress={onAddExpense}
          disabled={completing}
          testID="onboarding-add-expense"
        >
          {addExpenseLabel}
        </PrimaryButton>
        <PrimaryButton
          width="100%"
          variant="outlined"
          onPress={onInviteMembers}
          disabled={completing}
          testID="onboarding-invite-members"
        >
          {inviteMembersLabel}
        </PrimaryButton>
        <PrimaryButton
          width="100%"
          variant="outlined"
          onPress={onGoToDashboard}
          disabled={completing}
          testID="onboarding-go-dashboard"
        >
          {goToDashboardLabel}
        </PrimaryButton>
      </XStack>
    </YStack>
  );
}
