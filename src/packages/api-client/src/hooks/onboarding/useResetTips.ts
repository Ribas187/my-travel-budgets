import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useResetTips() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.onboarding.resetTips(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.me,
      });
    },
  });
}
