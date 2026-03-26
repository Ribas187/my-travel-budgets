// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { AddExpenseModal } from './AddExpenseModal';

let capturedProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  AddExpenseModal: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="add-expense-modal-ui" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockTravel: TravelDetail = {
  id: 't1',
  name: 'Test Trip',
  description: null,
  imageUrl: null,
  currency: 'USD',
  budget: 1000,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [],
  categories: [],
};

const mockDashboard = {
  currency: 'USD',
  overall: { totalBudget: 1000, totalSpent: 500, remaining: 500, status: 'ok' as const },
  memberSpending: [],
  categorySpending: [
    { categoryId: 'c1', name: 'Food', totalSpent: 200, budgetLimit: 500 },
  ],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.expenses.create = vi.fn().mockResolvedValue({ id: 'new-e' });
  client.expenses.update = vi.fn().mockResolvedValue({ id: 'e1' });
  client.expenses.delete = vi.fn().mockResolvedValue({});
  client.dashboard.get = vi.fn().mockResolvedValue(mockDashboard);
  return client;
}

function renderAddExpenseModal(props: Partial<Parameters<typeof AddExpenseModal>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <AddExpenseModal open={true} onClose={() => {}} {...props} />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    ),
    mockClient,
    queryClient,
  };
}

afterEach(() => {
  cleanup();
  capturedProps = {};
});

describe('AddExpenseModal', () => {
  it('calls onSuccess after successful create mutation (not showToast)', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const { mockClient } = renderAddExpenseModal({ onSuccess, onClose });

    // The mocked UI component captures the onSave handler
    expect(capturedProps.onSave).toBeDefined();

    const handleSave = capturedProps.onSave as (data: unknown) => void;

    await act(async () => {
      handleSave({
        description: 'Test expense',
        amount: 100,
        categoryId: 'c1',
        memberId: 'm1',
        date: '2026-01-05',
      });
    });

    expect(mockClient.expenses.create).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('expense.saved');
    expect(onClose).toHaveBeenCalled();
  });

  it('preserves budget impact watching logic with onCategoryChange and onAmountChange', () => {
    renderAddExpenseModal();

    // The modal should pass budget impact watching callbacks to the UI
    expect(capturedProps.onCategoryChange).toBeDefined();
    expect(capturedProps.onAmountChange).toBeDefined();
    expect(capturedProps.budgetImpact).toBeDefined();
  });

  it('passes onNavigateToCategories to UI component', () => {
    const onNavigateToCategories = vi.fn();
    renderAddExpenseModal({ onNavigateToCategories });

    expect(capturedProps.onNavigateToCategories).toBe(onNavigateToCategories);
  });

  it('initializes watched state from expense when editing', () => {
    const expense = {
      id: 'e1',
      travelId: 't1',
      categoryId: 'c1',
      memberId: 'm1',
      amount: 150,
      description: 'Existing',
      date: '2026-01-02',
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };

    renderAddExpenseModal({ expense });

    // The expense data should be passed through to the UI
    expect(capturedProps.expense).toBe(expense);
  });
});
