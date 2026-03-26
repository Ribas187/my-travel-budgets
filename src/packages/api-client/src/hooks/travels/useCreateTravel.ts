import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateTravelInput } from '../../types';
import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useCreateTravel() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTravelInput) => apiClient.travels.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.all,
      });
    },
  });
}
