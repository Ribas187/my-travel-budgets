import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/api-client';
import type { UpdateExpenseInput } from '@repo/api-client';

import { apiClient } from '@/apiClient';

export function useUpdateExpense(travelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: UpdateExpenseInput }) =>
      apiClient.expenses.update(travelId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.list(travelId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.get(travelId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.detail(travelId),
      });
    },
  });
}
