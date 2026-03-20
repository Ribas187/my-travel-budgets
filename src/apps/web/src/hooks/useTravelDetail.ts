import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useTravelDetail(travelId: string) {
  return useQuery({
    queryKey: queryKeys.travels.detail(travelId),
    queryFn: () => apiClient.travels.get(travelId),
    enabled: !!travelId,
  });
}
