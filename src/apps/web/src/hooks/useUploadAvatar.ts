import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: Blob) => apiClient.users.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.me,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.all,
      });
    },
  });
}
