import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useSetMainTravel() {
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
