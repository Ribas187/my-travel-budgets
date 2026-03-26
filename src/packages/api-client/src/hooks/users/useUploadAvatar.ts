import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useUploadAvatar() {
  const apiClient = useApiClient();
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
