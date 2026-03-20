import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import type { UpdateCategoryInput } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useUpdateCategory(travelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ catId, data }: { catId: string; data: UpdateCategoryInput }) =>
      apiClient.categories.update(travelId, catId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.list(travelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.get(travelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.detail(travelId),
      })
    },
  })
}
