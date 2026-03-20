import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useUserMe() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => apiClient.users.getMe(),
  })
}
