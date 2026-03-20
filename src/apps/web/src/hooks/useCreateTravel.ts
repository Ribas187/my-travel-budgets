import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';
import type { CreateTravelInput, Travel } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useCreateTravel() {
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
