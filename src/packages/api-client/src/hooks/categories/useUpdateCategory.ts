import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateCategoryInput } from '../../types';
import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useUpdateCategory(travelId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ catId, data }: { catId: string; data: UpdateCategoryInput }) =>
      apiClient.categories.update(travelId, catId, data),
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
