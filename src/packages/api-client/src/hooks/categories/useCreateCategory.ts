import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateCategoryInput } from '../../types';
import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useCreateCategory(travelId: string) {
  const apiClient = useApiClient();
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
