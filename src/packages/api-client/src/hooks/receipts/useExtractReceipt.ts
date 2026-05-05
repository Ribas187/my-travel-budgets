import { useCallback, useRef } from 'react';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { ExtractedReceipt } from '@repo/core';

import type { ApiError } from '../../types';
import { useApiClient } from '../../provider';

export type UseExtractReceiptResult = UseMutationResult<ExtractedReceipt, ApiError, Blob> & {
  /** Aborts the in-flight extraction request, if any. Safe to call when idle. */
  cancel: () => void;
};

export function useExtractReceipt(travelId: string): UseExtractReceiptResult {
  const apiClient = useApiClient();
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation<ExtractedReceipt, ApiError, Blob>({
    mutationFn: (file: Blob) => {
      // Replace any previous controller so a new request always has its own signal.
      abortRef.current = new AbortController();
      return apiClient.receipts.extract(travelId, file, { signal: abortRef.current.signal });
    },
  });

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return Object.assign(mutation, { cancel });
}
