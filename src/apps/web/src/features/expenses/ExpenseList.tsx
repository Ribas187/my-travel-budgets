import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ExpenseListView, AddExpenseModal } from '@repo/ui';
import type { AddExpenseFormValues } from '@repo/ui';
import type { TravelDetail, Expense, ExpenseFilters } from '@repo/api-client';

import { useTravelExpenses } from '@/hooks/useTravelExpenses';
import { useCreateExpense } from '@/hooks/useCreateExpense';
import { useUpdateExpense } from '@/hooks/useUpdateExpense';
import { useDeleteExpense } from '@/hooks/useDeleteExpense';
import { useBudgetImpact } from '@/hooks/useBudgetImpact';
import { showToast } from '@/lib/toast';
import { useTranslation } from 'react-i18next';

interface ExpenseListProps {
  travel: TravelDetail;
}

export function ExpenseList({ travel }: ExpenseListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [watchedCategoryId, setWatchedCategoryId] = useState('');
  const [watchedAmount, setWatchedAmount] = useState(0);

  const filters: ExpenseFilters | undefined = selectedCategoryId
    ? { categoryId: selectedCategoryId }
    : undefined;

  const { data: expenses = [], isLoading } = useTravelExpenses(travel.id, filters);
  const createExpense = useCreateExpense(travel.id);
  const updateExpense = useUpdateExpense(travel.id);
  const deleteExpense = useDeleteExpense(travel.id);
  const budgetImpact = useBudgetImpact(travel.id, watchedCategoryId, watchedAmount);

  const handleSave = useCallback(
    (data: AddExpenseFormValues) => {
      if (selectedExpense) {
        updateExpense.mutate(
          { expenseId: selectedExpense.id, data },
          {
            onSuccess: () => {
              showToast(t('expense.updated'));
              setSelectedExpense(null);
            },
          },
        );
      } else {
        createExpense.mutate(data, {
          onSuccess: () => {
            showToast(t('expense.saved'));
            setSelectedExpense(null);
          },
        });
      }
    },
    [selectedExpense, createExpense, updateExpense, t],
  );

  const handleDelete = useCallback(
    (expenseId: string) => {
      deleteExpense.mutate(expenseId, {
        onSuccess: () => {
          showToast(t('expense.deleted'));
          setSelectedExpense(null);
        },
      });
    },
    [deleteExpense, t],
  );

  return (
    <ExpenseListView
      travel={travel}
      expenses={expenses}
      isLoading={isLoading}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
      onSelectExpense={setSelectedExpense}
    >
      <AddExpenseModal
        open={!!selectedExpense}
        travel={travel}
        expense={selectedExpense}
        budgetImpact={budgetImpact}
        saving={createExpense.isPending || updateExpense.isPending}
        deleting={deleteExpense.isPending}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setSelectedExpense(null)}
        onNavigateToCategories={() =>
          navigate({ to: '/travels/$travelId/categories', params: { travelId: travel.id } })
        }
        onCategoryChange={setWatchedCategoryId}
        onAmountChange={setWatchedAmount}
      />
    </ExpenseListView>
  );
}
