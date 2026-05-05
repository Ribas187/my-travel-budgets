import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { ExtractedReceipt } from '@repo/core';

import type { ApiError } from '../../types';
import { useApiClient } from '../../provider';

export function useExtractReceipt(
  travelId: string,
): UseMutationResult<ExtractedReceipt, ApiError, Blob> {
  const apiClient = useApiClient();

  return useMutation<ExtractedReceipt, ApiError, Blob>({
    mutationFn: (file: Blob) => apiClient.receipts.extract(travelId, file),
  });
}
