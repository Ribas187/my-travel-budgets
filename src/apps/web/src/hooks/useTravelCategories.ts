import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@repo/api-client'
import { useTravelDetail } from './useTravelDetail'

export function useTravelCategories(travelId: string) {
  const { data: travel, isLoading, error } = useTravelDetail(travelId)

  return {
    data: travel?.categories,
    isLoading,
    error,
  }
}
