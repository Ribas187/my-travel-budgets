import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useRemoveMember(travelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => apiClient.members.remove(travelId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.detail(travelId),
      });
    },
  });
}
