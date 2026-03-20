import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useDashboard(travelId: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.get(travelId),
    queryFn: () => apiClient.dashboard.get(travelId),
    enabled: !!travelId,
  })
}
