import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useDashboard(travelId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: queryKeys.dashboard.get(travelId),
    queryFn: () => apiClient.dashboard.get(travelId),
    enabled: !!travelId,
  });
}
