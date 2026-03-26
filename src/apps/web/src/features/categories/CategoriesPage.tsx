import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoriesView } from '@repo/ui';
import type { CategoryFormState } from '@repo/ui';
import { DEFAULT_CATEGORY_EMOJI, DEFAULT_CATEGORY_COLOR } from '@repo/core';
import type { Category, CreateCategoryInput, UpdateCategoryInput, TravelDetail } from '@repo/api-client';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useTravelExpenses } from '@repo/api-client';

import { showToast } from '@/lib/toast';

const DEFAULT_FORM: CategoryFormState = {
  name: '',
  budgetLimit: '',
  selectedEmoji: DEFAULT_CATEGORY_EMOJI,
  selectedColor: DEFAULT_CATEGORY_COLOR,
};

function getFormFromCategory(category: Category): CategoryFormState {
  return {
    name: category.name,
    budgetLimit: category.budgetLimit != null ? String(category.budgetLimit) : '',
    selectedEmoji: category.icon,
    selectedColor: category.color,
  };
}

interface CategoriesPageProps {
  travel: TravelDetail;
  isOwner: boolean;
}

export function CategoriesPage({ travel, isOwner }: CategoriesPageProps) {
  const { t } = useTranslation();
  const categories = travel.categories ?? [];
  const travelId = travel.id;

  const createCategory = useCreateCategory(travelId);
  const updateCategory = useUpdateCategory(travelId);
  const deleteCategory = useDeleteCategory(travelId);
  const { data: expenses } = useTravelExpenses(travelId);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleToggle = useCallback(
    (id: string, category?: Category) => {
      if (expandedId === id) {
        setExpandedId(null);
      } else {
        setExpandedId(id);
        if (category) {
          setForm(getFormFromCategory(category));
        } else {
          setForm(DEFAULT_FORM);
        }
      }
    },
    [expandedId],
  );

  const handleCancel = useCallback(() => {
    setExpandedId(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setExpandedId('new');
    setForm(DEFAULT_FORM);
  }, []);

  const handleFormChange = useCallback((update: Partial<CategoryFormState>) => {
    setForm((f) => ({ ...f, ...update }));
  }, []);

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
          showToast(t('category.created'));
          setExpandedId(null);
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
            showToast(t('category.saved'));
            setExpandedId(null);
          },
        },
      );
    }
  }, [expandedId, form, createCategory, updateCategory, t]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        showToast(t('category.deleted'));
        setDeleteTarget(null);
        setExpandedId(null);
      },
    });
  }, [deleteTarget, deleteCategory, t]);

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
