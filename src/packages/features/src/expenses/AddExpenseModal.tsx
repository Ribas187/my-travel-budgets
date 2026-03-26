import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AddExpenseModal as AddExpenseModalUI } from '@repo/ui';
import type { AddExpenseFormValues } from '@repo/ui';
import type { Expense } from '@repo/api-client';
import { useCreateExpense, useUpdateExpense, useDeleteExpense, useBudgetImpact } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';

export interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onNavigateToCategories?: () => void;
}

export function AddExpenseModal({
  open,
  onClose,
  expense,
  onSuccess,
  onNavigateToCategories,
}: AddExpenseModalProps) {
  const { t } = useTranslation();
  const { travel } = useTravelContext();

  const createExpense = useCreateExpense(travel.id);
  const updateExpense = useUpdateExpense(travel.id);
  const deleteExpense = useDeleteExpense(travel.id);

  const [watchedCategoryId, setWatchedCategoryId] = useState(expense?.categoryId ?? '');
  const [watchedAmount, setWatchedAmount] = useState(expense?.amount ?? 0);

  useEffect(() => {
    setWatchedCategoryId(expense?.categoryId ?? '');
    setWatchedAmount(expense?.amount ?? 0);
  }, [expense]);

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
      onNavigateToCategories={onNavigateToCategories}
      onCategoryChange={setWatchedCategoryId}
      onAmountChange={setWatchedAmount}
    />
  );
}
