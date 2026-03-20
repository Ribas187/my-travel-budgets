import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';
import type { UpdateTravelInput } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useUpdateTravel(travelId: string) {
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
