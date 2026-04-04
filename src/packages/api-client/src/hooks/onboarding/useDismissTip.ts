import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';
import type { UserMe } from '../../types';

export function useDismissTip() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tipId: string) => apiClient.onboarding.dismissTip(tipId),
    onMutate: async (tipId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.me });

      const previousUser = queryClient.getQueryData<UserMe>(queryKeys.users.me);

      if (previousUser) {
        queryClient.setQueryData<UserMe>(queryKeys.users.me, {
          ...previousUser,
          dismissedTips: previousUser.dismissedTips.includes(tipId)
            ? previousUser.dismissedTips
            : [...previousUser.dismissedTips, tipId],
        });
      }

      return { previousUser };
    },
    onError: (_error, _tipId, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData<UserMe>(queryKeys.users.me, context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.me,
      });
    },
  });
}
