import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ExpenseListView, AddExpenseModal as AddExpenseModalUI, InlineTip } from '@repo/ui';
import type { AddExpenseFormValues } from '@repo/ui';
import type { Expense, ExpenseFilters } from '@repo/api-client';
import { useTravelExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useBudgetImpact } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';
import { useTip } from '../onboarding/useTip';

export interface ExpenseListProps {
  onNavigateToCategories?: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ExpenseList({ onNavigateToCategories, onSuccess }: ExpenseListProps) {
  const { t } = useTranslation();
  const { travel } = useTravelContext();
  const { shouldShow: shouldShowNoCategoriesTip, dismiss: dismissNoCategoriesTip } = useTip('expenses_no_categories');
  const hasNoCategories = !travel.categories || travel.categories.length === 0;

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
              onSuccess?.(t('expense.updated'));
              setSelectedExpense(null);
            },
          },
        );
      } else {
        createExpense.mutate(data, {
          onSuccess: () => {
            onSuccess?.(t('expense.saved'));
            setSelectedExpense(null);
          },
        });
      }
    },
    [selectedExpense, createExpense, updateExpense, t, onSuccess],
  );

  const handleDelete = useCallback(
    (expenseId: string) => {
      deleteExpense.mutate(expenseId, {
        onSuccess: () => {
          onSuccess?.(t('expense.deleted'));
          setSelectedExpense(null);
        },
      });
    },
    [deleteExpense, t, onSuccess],
  );

  return (
    <>
      {shouldShowNoCategoriesTip && hasNoCategories && (
        <InlineTip
          tipId="expenses_no_categories"
          message={t('onboarding.tip.expensesNoCategories')}
          icon="📂"
          ctaLabel={t('onboarding.tip.expensesNoCategoriesCta')}
          onCtaPress={onNavigateToCategories}
          onDismiss={dismissNoCategoriesTip}
        />
      )}
      <ExpenseListView
        travel={travel}
        expenses={expenses}
        isLoading={isLoading}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onSelectExpense={setSelectedExpense}
      >
      <AddExpenseModalUI
        open={!!selectedExpense}
        travel={travel}
        expense={selectedExpense}
        budgetImpact={budgetImpact}
        saving={createExpense.isPending || updateExpense.isPending}
        deleting={deleteExpense.isPending}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setSelectedExpense(null)}
        onNavigateToCategories={onNavigateToCategories ?? (() => {})}
        onCategoryChange={setWatchedCategoryId}
        onAmountChange={setWatchedAmount}
      />
    </ExpenseListView>
    </>
  );
}
