import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useDeleteCategory(travelId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (catId: string) => apiClient.categories.delete(travelId, catId),
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
