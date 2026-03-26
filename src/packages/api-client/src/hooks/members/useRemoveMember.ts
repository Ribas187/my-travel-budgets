import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useRemoveMember(travelId: string) {
  const apiClient = useApiClient();
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
