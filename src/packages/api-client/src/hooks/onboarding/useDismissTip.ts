import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UserMe } from '../../types';
import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useDismissTip() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tipId: string) => apiClient.onboarding.dismissTip(tipId),
    onMutate: async (tipId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.me });
      const previous = queryClient.getQueryData<UserMe>(queryKeys.users.me);

      if (previous) {
        queryClient.setQueryData<UserMe>(queryKeys.users.me, {
          ...previous,
          dismissedTips: [...previous.dismissedTips, tipId],
        });
      }

      return { previous };
    },
    onError: (_err, _tipId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.users.me, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}
