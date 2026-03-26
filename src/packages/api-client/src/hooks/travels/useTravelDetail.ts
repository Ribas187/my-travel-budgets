import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useTravelDetail(travelId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: queryKeys.travels.detail(travelId),
    queryFn: () => apiClient.travels.get(travelId),
    enabled: !!travelId,
  });
}
