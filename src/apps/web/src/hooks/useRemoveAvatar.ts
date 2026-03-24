import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.users.removeAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.me,
      });
    },
  });
}
