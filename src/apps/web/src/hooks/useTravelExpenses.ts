import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import type { Expense, ExpenseFilters } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useTravelExpenses(travelId: string, filters?: ExpenseFilters) {
  return useQuery({
    queryKey: queryKeys.expenses.list(travelId, filters),
    queryFn: async (): Promise<Expense[]> => {
      const result = await apiClient.expenses.list(travelId, filters)
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && Array.isArray((result as any).data)) {
        return (result as any).data as Expense[]
      }
      return []
    },
    enabled: !!travelId,
  })
}
