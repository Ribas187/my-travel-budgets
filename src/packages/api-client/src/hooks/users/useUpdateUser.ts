import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useUpdateUser() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string }) => apiClient.users.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.me,
      });
    },
  });
}
