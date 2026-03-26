import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useSetMainTravel() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (travelId: string | null) => apiClient.users.setMainTravel(travelId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.me,
      });
    },
  });
}
