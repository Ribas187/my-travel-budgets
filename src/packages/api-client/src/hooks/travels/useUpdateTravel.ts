import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateTravelInput } from '../../types';
import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useUpdateTravel(travelId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTravelInput) => apiClient.travels.update(travelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.detail(travelId),
      });
    },
  });
}
