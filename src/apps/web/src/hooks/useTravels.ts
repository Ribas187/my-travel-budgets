import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useTravels() {
  return useQuery({
    queryKey: queryKeys.travels.all,
    queryFn: () => apiClient.travels.list(),
  });
}
