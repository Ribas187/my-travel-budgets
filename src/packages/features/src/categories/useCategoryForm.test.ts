// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DEFAULT_CATEGORY_EMOJI, DEFAULT_CATEGORY_COLOR } from '@repo/core';

import { useCategoryForm, DEFAULT_FORM } from './useCategoryForm';

describe('useCategoryForm', () => {
  it('initializes with default form state', () => {
    const { result } = renderHook(() => useCategoryForm());

    expect(result.current.form).toEqual(DEFAULT_FORM);
    expect(result.current.expandedId).toBeNull();
    expect(result.current.deleteTarget).toBeNull();
  });

  it('updates form via handleFormChange', () => {
    const { result } = renderHook(() => useCategoryForm());

    act(() => {
      result.current.handleFormChange({ name: 'Food' });
    });

    expect(result.current.form.name).toBe('Food');
    expect(result.current.form.selectedEmoji).toBe(DEFAULT_CATEGORY_EMOJI);

    act(() => {
      result.current.handleFormChange({ budgetLimit: '500', selectedColor: '#FF0000' });
    });

    expect(result.current.form.name).toBe('Food');
    expect(result.current.form.budgetLimit).toBe('500');
    expect(result.current.form.selectedColor).toBe('#FF0000');
  });

  it('resets form state', () => {
    const { result } = renderHook(() => useCategoryForm());

    act(() => {
      result.current.handleFormChange({ name: 'Food' });
      result.current.setExpandedId('cat-1');
      result.current.setDeleteTarget({ id: 'cat-1', travelId: 't1', name: 'Food', icon: '🍕', color: '#FF0000', budgetLimit: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' });
    });

    expect(result.current.form.name).toBe('Food');
    expect(result.current.expandedId).toBe('cat-1');
    expect(result.current.deleteTarget).not.toBeNull();

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.form).toEqual(DEFAULT_FORM);
    expect(result.current.expandedId).toBeNull();
    expect(result.current.deleteTarget).toBeNull();
  });

  it('manages expanded item via handleToggle', () => {
    const { result } = renderHook(() => useCategoryForm());
    const mockCategory = { id: 'cat-1', travelId: 't1', name: 'Food', icon: '🍕', color: '#FF0000', budgetLimit: 200, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };

    // Expand a category
    act(() => {
      result.current.handleToggle('cat-1', mockCategory);
    });

    expect(result.current.expandedId).toBe('cat-1');
    expect(result.current.form.name).toBe('Food');
    expect(result.current.form.selectedEmoji).toBe('🍕');
    expect(result.current.form.budgetLimit).toBe('200');

    // Toggle same category collapses
    act(() => {
      result.current.handleToggle('cat-1');
    });

    expect(result.current.expandedId).toBeNull();
  });

  it('manages delete target', () => {
    const { result } = renderHook(() => useCategoryForm());
    const target = { id: 'cat-1', travelId: 't1', name: 'Food', icon: '🍕', color: '#FF0000', budgetLimit: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };

    act(() => {
      result.current.setDeleteTarget(target);
    });

    expect(result.current.deleteTarget).toEqual(target);

    act(() => {
      result.current.setDeleteTarget(null);
    });

    expect(result.current.deleteTarget).toBeNull();
  });

  it('handleAddNew sets expandedId to "new" and resets form', () => {
    const { result } = renderHook(() => useCategoryForm());

    act(() => {
      result.current.handleFormChange({ name: 'Existing' });
    });

    act(() => {
      result.current.handleAddNew();
    });

    expect(result.current.expandedId).toBe('new');
    expect(result.current.form).toEqual(DEFAULT_FORM);
  });

  it('handleCancel clears expandedId', () => {
    const { result } = renderHook(() => useCategoryForm());

    act(() => {
      result.current.handleAddNew();
    });
    expect(result.current.expandedId).toBe('new');

    act(() => {
      result.current.handleCancel();
    });
    expect(result.current.expandedId).toBeNull();
  });
});
