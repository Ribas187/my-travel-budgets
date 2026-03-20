import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import type { CreateExpenseInput } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useCreateExpense(travelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseInput) =>
      apiClient.expenses.create(travelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.list(travelId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.get(travelId),
      })
    },
  })
}
