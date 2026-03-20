import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useUpdateUser() {
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
