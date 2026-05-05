import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AddExpenseModal as AddExpenseModalUI } from '@repo/ui';
import type { AddExpenseFormValues } from '@repo/ui';
import type { Expense } from '@repo/api-client';
import type { ExtractedReceipt } from '@repo/core';
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useBudgetImpact,
  useExtractReceipt,
  type ApiError,
} from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';

const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onNavigateToCategories?: () => void;
  /**
   * Optional client-side image-prep step (downscale + EXIF strip).
   * Web supplies `prepareReceiptImage`. When omitted, the scan UI is hidden.
   */
  prepareImage?: (file: File) => Promise<Blob>;
}

export function AddExpenseModal({
  open,
  onClose,
  expense,
  onSuccess,
  onNavigateToCategories,
  prepareImage,
}: AddExpenseModalProps) {
  const { t } = useTranslation();
  const { travel } = useTravelContext();

  const createExpense = useCreateExpense(travel.id);
  const updateExpense = useUpdateExpense(travel.id);
  const deleteExpense = useDeleteExpense(travel.id);
  const extractReceipt = useExtractReceipt(travel.id);

  const [watchedCategoryId, setWatchedCategoryId] = useState(expense?.categoryId ?? '');
  const [watchedAmount, setWatchedAmount] = useState(expense?.amount ?? 0);

  // Scan-receipt orchestration state.
  const [prefill, setPrefill] = useState<Partial<ExtractedReceipt> | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  useEffect(() => {
    setWatchedCategoryId(expense?.categoryId ?? '');
    setWatchedAmount(expense?.amount ?? 0);
  }, [expense]);

  // Reset scan state whenever the modal closes or switches into edit mode.
  useEffect(() => {
    if (!open || expense) {
      setPrefill(null);
      setScanError(null);
      setLastFile(null);
    }
  }, [open, expense]);

  const budgetImpact = useBudgetImpact(travel.id, watchedCategoryId, watchedAmount);

  const handleSave = useCallback(
    (data: AddExpenseFormValues) => {
      if (expense) {
        updateExpense.mutate(
          { expenseId: expense.id, data },
          {
            onSuccess: () => {
              onSuccess?.(t('expense.updated'));
              onClose();
            },
          },
        );
      } else {
        createExpense.mutate(data, {
          onSuccess: () => {
            onSuccess?.(t('expense.saved'));
            setPrefill(null);
            setScanError(null);
            setLastFile(null);
            onClose();
          },
        });
      }
    },
    [expense, createExpense, updateExpense, t, onClose, onSuccess],
  );

  const handleDelete = useCallback(
    (expenseId: string) => {
      deleteExpense.mutate(expenseId, {
        onSuccess: () => {
          onSuccess?.(t('expense.deleted'));
          onClose();
        },
      });
    },
    [deleteExpense, t, onClose, onSuccess],
  );

  const runExtraction = useCallback(
    async (file: File) => {
      // Local guards (mirror server validators) so we never make a network call
      // we know will be rejected.
      if (!ACCEPTED_MIME.has(file.type)) {
        setScanError(t('receipt.error.wrongType'));
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setScanError(t('receipt.error.tooLarge'));
        return;
      }

      setScanError(null);
      try {
        const blob = prepareImage ? await prepareImage(file) : file;
        const extracted = await extractReceipt.mutateAsync(blob);
        setPrefill(extracted);
      } catch (err) {
        const apiErr = err as ApiError | undefined;
        const status = apiErr?.statusCode;
        if (status === 422) {
          setScanError(t('receipt.error.unreadable'));
        } else if (status === 502 || status === 503 || status === undefined) {
          setScanError(t('receipt.error.upstream'));
        } else {
          setScanError(t('receipt.error.upstream'));
        }
      }
    },
    [prepareImage, extractReceipt, t],
  );

  const handleScanFile = useCallback(
    (file: File) => {
      setLastFile(file);
      void runExtraction(file);
    },
    [runExtraction],
  );

  const handleScanRetry = useCallback(() => {
    if (!lastFile) {
      setScanError(null);
      return;
    }
    void runExtraction(lastFile);
  }, [lastFile, runExtraction]);

  const handleScanContinueManually = useCallback(() => {
    setScanError(null);
    setPrefill(null);
    setLastFile(null);
  }, []);

  const isNewExpense = !expense;

  return (
    <AddExpenseModalUI
      open={open}
      travel={travel}
      expense={expense}
      budgetImpact={budgetImpact}
      saving={createExpense.isPending || updateExpense.isPending}
      deleting={deleteExpense.isPending}
      onSave={handleSave}
      onDelete={handleDelete}
      onClose={onClose}
      onNavigateToCategories={onNavigateToCategories ?? (() => {})}
      onCategoryChange={setWatchedCategoryId}
      onAmountChange={setWatchedAmount}
      prefill={isNewExpense ? prefill : null}
      onScanFile={isNewExpense && prepareImage ? handleScanFile : undefined}
      scanLoading={extractReceipt.isPending}
      scanError={scanError}
      onScanRetry={lastFile ? handleScanRetry : undefined}
      onScanContinueManually={handleScanContinueManually}
    />
  );
}
