import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import type { AddMemberInput } from '@repo/api-client'
import { apiClient } from '@/apiClient'

export function useAddMember(travelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddMemberInput) =>
      apiClient.members.add(travelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.travels.detail(travelId),
      })
    },
  })
}
