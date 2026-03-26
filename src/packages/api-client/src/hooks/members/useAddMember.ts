import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AddMemberInput } from '../../types';
import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useAddMember(travelId: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberInput) => apiClient.members.add(travelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.detail(travelId),
      });
    },
  });
}
