import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';
import type { UserMe } from '../../types';

export function useCompleteOnboarding() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.onboarding.complete(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.me });

      const previousUser = queryClient.getQueryData<UserMe>(queryKeys.users.me);

      if (previousUser) {
        queryClient.setQueryData<UserMe>(queryKeys.users.me, {
          ...previousUser,
          onboardingCompletedAt: new Date().toISOString(),
        });
      }

      return { previousUser };
    },
    onError: (_error, _variables, context) => {
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
