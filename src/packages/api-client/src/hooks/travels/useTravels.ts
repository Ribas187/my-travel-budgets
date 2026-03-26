import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useTravels() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: queryKeys.travels.all,
    queryFn: () => apiClient.travels.list(),
  });
}
