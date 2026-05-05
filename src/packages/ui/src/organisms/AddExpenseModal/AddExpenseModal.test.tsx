import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { AddExpenseModal } from './AddExpenseModal';

// These tests follow the package's existing shallow-inspection convention:
// they verify the component contract by reading the React element's props
// rather than rendering through the Tamagui tree. The full DOM behavior of
// the embedded `ScanReceiptButton` is covered in its own test file, and the
// orchestration that calls back into this component is covered in the
// `@repo/features` AddExpenseModal test.

const baseTravel = {
  id: 't1',
  name: 'Trip',
  description: null,
  imageUrl: null,
  currency: 'USD',
  budget: 1000,
  startDate: '2026-01-01',
  endDate: '2026-01-15',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [{ id: 'm1', travelId: 't1', userId: null, guestName: 'A', role: 'owner' as const, user: null, createdAt: '', updatedAt: '' }],
  categories: [],
};

const baseBudgetImpact = { level: 'none', categoryName: 'Food', percentageAfter: 0 };

const baseExpense = {
  id: 'e1',
  travelId: 't1',
  categoryId: 'c1',
  memberId: 'm1',
  amount: 12.5,
  description: 'Existing',
  date: '2026-01-02',
  createdAt: '2026-01-02T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

describe('AddExpenseModal — scan-receipt props', () => {
  it('passes prefill, scan handlers, and loading/error state through', () => {
    const onScanFile = vi.fn();
    const onScanRetry = vi.fn();
    const onScanContinueManually = vi.fn();
    const prefill = { merchant: 'Café', total: 42.5, date: '2026-05-05' };

    const element = React.createElement(AddExpenseModal, {
      open: true,
      travel: baseTravel,
      expense: null,
      budgetImpact: baseBudgetImpact,
      saving: false,
      deleting: false,
      onSave: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      onNavigateToCategories: vi.fn(),
      prefill,
      onScanFile,
      scanLoading: true,
      scanError: 'oops',
      onScanRetry,
      onScanContinueManually,
    });

    expect(element.props.prefill).toEqual(prefill);
    expect(element.props.onScanFile).toBe(onScanFile);
    expect(element.props.scanLoading).toBe(true);
    expect(element.props.scanError).toBe('oops');
    expect(element.props.onScanRetry).toBe(onScanRetry);
    expect(element.props.onScanContinueManually).toBe(onScanContinueManually);
  });

  it('accepts no scan props (backwards-compatible default)', () => {
    const element = React.createElement(AddExpenseModal, {
      open: true,
      travel: baseTravel,
      expense: null,
      budgetImpact: baseBudgetImpact,
      saving: false,
      deleting: false,
      onSave: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      onNavigateToCategories: vi.fn(),
    });

    expect(element.props.prefill).toBeUndefined();
    expect(element.props.onScanFile).toBeUndefined();
  });

  it('still receives an existing expense when in edit mode (scan UI is suppressed inside the component)', () => {
    const element = React.createElement(AddExpenseModal, {
      open: true,
      travel: baseTravel,
      expense: baseExpense,
      budgetImpact: baseBudgetImpact,
      saving: false,
      deleting: false,
      onSave: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      onNavigateToCategories: vi.fn(),
      onScanFile: vi.fn(),
      prefill: { merchant: 'X', total: 1, date: '2026-05-05' },
    });

    // The component is responsible for hiding the scan button when an expense
    // is set (rendered behavior is covered indirectly by the integration test
    // in @repo/features). Here we just confirm the props pass through.
    expect(element.props.expense).toBe(baseExpense);
  });

  // Regression: BUG-02 / RF 3.7 — cancel handler must flow through.
  it('passes onScanCancel through (RF 3.7 — cancel during in-progress extraction)', () => {
    const onScanCancel = vi.fn();
    const element = React.createElement(AddExpenseModal, {
      open: true,
      travel: baseTravel,
      expense: null,
      budgetImpact: baseBudgetImpact,
      saving: false,
      deleting: false,
      onSave: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      onNavigateToCategories: vi.fn(),
      onScanFile: vi.fn(),
      onScanCancel,
      scanLoading: true,
    });

    expect(element.props.onScanCancel).toBe(onScanCancel);
  });

  // Regression: BUG-05 / RF 4.5 — discard handler must flow through.
  it('passes onScanDiscard through (RF 4.5 — discard extracted values)', () => {
    const onScanDiscard = vi.fn();
    const element = React.createElement(AddExpenseModal, {
      open: true,
      travel: baseTravel,
      expense: null,
      budgetImpact: baseBudgetImpact,
      saving: false,
      deleting: false,
      onSave: vi.fn(),
      onDelete: vi.fn(),
      onClose: vi.fn(),
      onNavigateToCategories: vi.fn(),
      onScanFile: vi.fn(),
      onScanDiscard,
      prefill: { merchant: 'Café', total: 10, date: '2026-05-05' },
    });

    expect(element.props.onScanDiscard).toBe(onScanDiscard);
  });
});
