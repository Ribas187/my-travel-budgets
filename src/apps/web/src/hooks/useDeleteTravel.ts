import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useDeleteTravel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (travelId: string) => apiClient.travels.delete(travelId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.all,
      })
    },
  })
}
