import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoriesView } from '@repo/ui';
import type { CreateCategoryInput, UpdateCategoryInput } from '@repo/api-client';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';
import { useCategoryForm } from './useCategoryForm';

export interface CategoriesPageProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function CategoriesPage({ onSuccess, onError }: CategoriesPageProps) {
  const { t } = useTranslation();
  const { travel, isOwner } = useTravelContext();
  const categories = travel.categories ?? [];
  const travelId = travel.id;

  const createCategory = useCreateCategory(travelId);
  const updateCategory = useUpdateCategory(travelId);
  const deleteCategory = useDeleteCategory(travelId);
  const { data: expenses } = useTravelExpenses(travelId);

  const {
    form,
    expandedId,
    deleteTarget,
    setDeleteTarget,
    handleToggle,
    handleCancel,
    handleAddNew,
    handleFormChange,
  } = useCategoryForm();

  const handleSave = useCallback(() => {
    const budgetLimit = form.budgetLimit ? Number(form.budgetLimit) : null;
    if (!form.name.trim()) return;

    if (expandedId === 'new') {
      const data: CreateCategoryInput = {
        name: form.name.trim(),
        icon: form.selectedEmoji,
        color: form.selectedColor,
        budgetLimit,
      };
      createCategory.mutate(data, {
        onSuccess: () => {
          onSuccess?.(t('category.created'));
          handleCancel();
        },
        onError: () => {
          onError?.(t('category.error'));
        },
      });
    } else if (expandedId) {
      const data: UpdateCategoryInput = {
        name: form.name.trim(),
        icon: form.selectedEmoji,
        color: form.selectedColor,
        budgetLimit,
      };
      updateCategory.mutate(
        { catId: expandedId, data },
        {
          onSuccess: () => {
            onSuccess?.(t('category.saved'));
            handleCancel();
          },
          onError: () => {
            onError?.(t('category.error'));
          },
        },
      );
    }
  }, [expandedId, form, createCategory, updateCategory, t, onSuccess, onError, handleCancel]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        onSuccess?.(t('category.deleted'));
        setDeleteTarget(null);
        handleCancel();
      },
      onError: () => {
        onError?.(t('category.error'));
      },
    });
  }, [deleteTarget, deleteCategory, t, onSuccess, onError, setDeleteTarget, handleCancel]);

  const getExpenseCountForCategory = useCallback(
    (categoryId: string) => {
      if (!expenses) return 0;
      return expenses.filter((e) => e.categoryId === categoryId).length;
    },
    [expenses],
  );

  return (
    <CategoriesView
      categories={categories}
      isOwner={isOwner}
      expandedId={expandedId}
      form={form}
      isSaving={createCategory.isPending || updateCategory.isPending}
      deleteTarget={deleteTarget}
      deleteExpenseCount={deleteTarget ? getExpenseCountForCategory(deleteTarget.id) : 0}
      isDeleting={deleteCategory.isPending}
      onToggle={handleToggle}
      onAddNew={handleAddNew}
      onCancel={handleCancel}
      onFormChange={handleFormChange}
      onSave={handleSave}
      onDeleteRequest={setDeleteTarget}
      onDeleteConfirm={handleDeleteConfirm}
      onDeleteCancel={() => setDeleteTarget(null)}
    />
  );
}
