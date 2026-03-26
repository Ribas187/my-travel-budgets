import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { AddExpenseModal as AddExpenseModalUI } from '@repo/ui';
import type { AddExpenseFormValues } from '@repo/ui';
import type { TravelDetail, Expense } from '@repo/api-client';
import { useCreateExpense, useUpdateExpense, useDeleteExpense, useBudgetImpact } from '@repo/api-client';
import { showToast } from '@/lib/toast';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  travel: TravelDetail;
  expense?: Expense | null;
}

export function AddExpenseModal({ open, onClose, travel, expense }: AddExpenseModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
              showToast(t('expense.updated'));
              onClose();
            },
          },
        );
      } else {
        createExpense.mutate(data, {
          onSuccess: () => {
            showToast(t('expense.saved'));
            onClose();
          },
        });
      }
    },
    [expense, createExpense, updateExpense, t, onClose],
  );

  const handleDelete = useCallback(
    (expenseId: string) => {
      deleteExpense.mutate(expenseId, {
        onSuccess: () => {
          showToast(t('expense.deleted'));
          onClose();
        },
      });
    },
    [deleteExpense, t, onClose],
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
      onNavigateToCategories={() =>
        navigate({ to: '/travels/$travelId/categories', params: { travelId: travel.id } })
      }
      onCategoryChange={setWatchedCategoryId}
      onAmountChange={setWatchedAmount}
    />
  );
}
