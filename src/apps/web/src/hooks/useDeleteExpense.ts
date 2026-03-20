import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useDeleteExpense(travelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (expenseId: string) =>
      apiClient.expenses.delete(travelId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.list(travelId),
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
