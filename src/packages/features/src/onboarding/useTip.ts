import { useCallback, useMemo } from 'react';
import { useUserMe, useDismissTip } from '@repo/api-client';
import type { OnboardingTipId } from '@repo/core';

export function useTip(tipId: OnboardingTipId) {
  const { data: user } = useUserMe();
  const dismissMutation = useDismissTip();

  const shouldShow = useMemo(() => {
    if (!user) return false;
    return !user.dismissedTips.includes(tipId);
  }, [user, tipId]);

  const dismiss = useCallback(() => {
    dismissMutation.mutate(tipId);
  }, [dismissMutation, tipId]);

  return { shouldShow, dismiss };
}
