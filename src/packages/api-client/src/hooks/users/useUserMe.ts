import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../provider';
import { queryKeys } from '../../queryKeys';

export function useUserMe() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => apiClient.users.getMe(),
  });
}
