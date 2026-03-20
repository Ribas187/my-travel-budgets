import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import type { ExpenseFilters } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useTravelExpenses(travelId: string, filters?: ExpenseFilters) {
  return useQuery({
    queryKey: queryKeys.expenses.list(travelId, filters),
    queryFn: () => apiClient.expenses.list(travelId, filters),
    enabled: !!travelId,
  })
}
