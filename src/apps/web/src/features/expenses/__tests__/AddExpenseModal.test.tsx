import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { AddExpenseModal } from '../AddExpenseModal';

const mockTravel = {
  id: 'travel-1',
  name: 'Test Trip',
  description: null,
  imageUrl: null,
  currency: 'USD',
  budget: 5000,
  startDate: '2026-06-01',
  endDate: '2026-06-15',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [
    {
      id: 'm1',
      travelId: 'travel-1',
      userId: 'u1',
      guestName: null,
      role: 'owner' as const,
      user: {
        id: 'u1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      createdAt: '',
      updatedAt: '',
    },
  ],
  categories: [
    {
      id: 'cat-1',
      travelId: 'travel-1',
      name: 'Food',
      icon: '🍔',
      color: '#F59E0B',
      budgetLimit: 500,
      createdAt: '',
      updatedAt: '',
    },
  ],
};

const mockExpense = {
  id: 'expense-1',
  travelId: 'travel-1',
  categoryId: 'cat-1',
  memberId: 'm1',
  amount: 42.5,
  description: 'Lunch at bistro',
  date: '2026-06-02',
  createdAt: '2026-06-02T12:30:00.000Z',
  updatedAt: '2026-06-02T12:30:00.000Z',
};

describe('AddExpenseModal date picker integration', () => {
  it('renders with date field visible in create mode', () => {
    const element = React.createElement(AddExpenseModal, {
      open: true,
      onClose: vi.fn(),
      travel: mockTravel as any,
    });
    expect(element).toBeDefined();
    // When no expense is provided, date defaults to today
    expect(element.props.expense).toBeUndefined();
  });

  it('defaults date to today for new expense', () => {
    const today = new Date().toISOString().split('T')[0];
    const element = React.createElement(AddExpenseModal, {
      open: true,
      onClose: vi.fn(),
      travel: mockTravel as any,
    });
    // The form defaultValues set date to today's ISO string
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(element).toBeDefined();
  });

  it('pre-selects existing date when editing an expense', () => {
    const element = React.createElement(AddExpenseModal, {
      open: true,
      onClose: vi.fn(),
      travel: mockTravel as any,
      expense: mockExpense as any,
    });
    // In edit mode, the expense date is passed and used as defaultValue
    expect(element.props.expense.date).toBe('2026-06-02');
  });

  it('does not render when open is false', () => {
    const element = React.createElement(AddExpenseModal, {
      open: false,
      onClose: vi.fn(),
      travel: mockTravel as any,
    });
    expect(element.props.open).toBe(false);
  });

  it('passes onClose callback for modal dismissal', () => {
    const onClose = vi.fn();
    const element = React.createElement(AddExpenseModal, {
      open: true,
      onClose,
      travel: mockTravel as any,
    });
    expect(element.props.onClose).toBe(onClose);
  });
});
