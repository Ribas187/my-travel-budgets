import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useDeleteTravel() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (travelId: string) => apiClient.travels.delete(travelId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.all,
      });
    },
  });
}
