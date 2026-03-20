import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';
import type { CreateCategoryInput } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useCreateCategory(travelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => apiClient.categories.create(travelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.list(travelId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.get(travelId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.detail(travelId),
      });
    },
  });
}
