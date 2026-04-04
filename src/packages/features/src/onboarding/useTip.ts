import { useCallback } from 'react';
import type { OnboardingTipId } from '@repo/core';
import { useUserMe, useDismissTip } from '@repo/api-client';

export function useTip(tipId: OnboardingTipId): {
  shouldShow: boolean;
  dismiss: () => void;
} {
  const { data: user, isLoading } = useUserMe();
  const dismissMutation = useDismissTip();

  const shouldShow =
    !isLoading &&
    !!user &&
    !!user.onboardingCompletedAt &&
    !user.dismissedTips.includes(tipId);

  const dismiss = useCallback(() => {
    dismissMutation.mutate(tipId);
  }, [dismissMutation, tipId]);

  return { shouldShow, dismiss };
}
