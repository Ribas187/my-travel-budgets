import { useState, useCallback } from 'react';
import type { CategoryFormState } from '@repo/ui';
import { DEFAULT_CATEGORY_EMOJI, DEFAULT_CATEGORY_COLOR } from '@repo/core';
import type { Category } from '@repo/api-client';

export const DEFAULT_FORM: CategoryFormState = {
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

export function useCategoryForm() {
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

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM);
    setExpandedId(null);
    setDeleteTarget(null);
  }, []);

  return {
    form,
    expandedId,
    deleteTarget,
    setExpandedId,
    setDeleteTarget,
    handleToggle,
    handleCancel,
    handleAddNew,
    handleFormChange,
    resetForm,
  };
}
