// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { ExpenseList } from './ExpenseList';

let capturedExpenseListViewProps: Record<string, unknown> = {};
let capturedAddExpenseModalProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  ExpenseListView: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
    capturedExpenseListViewProps = props;
    return <div data-testid="expense-list-view">{props.children}</div>;
  },
  AddExpenseModal: (props: Record<string, unknown>) => {
    capturedAddExpenseModalProps = props;
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

const mockExpenses = [
  {
    id: 'e1',
    travelId: 't1',
    categoryId: 'c1',
    memberId: 'm1',
    amount: 100,
    description: 'Lunch',
    date: '2026-01-02',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'e2',
    travelId: 't1',
    categoryId: 'c2',
    memberId: 'm1',
    amount: 50,
    description: 'Coffee',
    date: '2026-01-02',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.expenses.list = vi.fn().mockResolvedValue(mockExpenses);
  client.expenses.create = vi.fn().mockResolvedValue({ id: 'new-e' });
  client.expenses.update = vi.fn().mockResolvedValue({ id: 'e1' });
  client.expenses.delete = vi.fn().mockResolvedValue({});
  client.dashboard.get = vi.fn().mockResolvedValue({
    currency: 'USD',
    overall: { totalBudget: 1000, totalSpent: 500, remaining: 500, status: 'ok' as const },
    memberSpending: [],
    categorySpending: [],
  });
  return client;
}

function renderExpenseList(props: Partial<Parameters<typeof ExpenseList>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <ExpenseList {...props} />
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
  capturedExpenseListViewProps = {};
  capturedAddExpenseModalProps = {};
});

describe('ExpenseList', () => {
  it('fetches and renders expenses from the travel context', async () => {
    const { mockClient } = renderExpenseList();

    await waitFor(() => {
      expect(mockClient.expenses.list).toHaveBeenCalledWith('t1', undefined);
    });
  });

  it('filters expenses by selected category via onSelectCategory', async () => {
    const { mockClient } = renderExpenseList();

    await waitFor(() => {
      expect(capturedExpenseListViewProps.onSelectCategory).toBeDefined();
    });

    // Simulate selecting a category
    await act(async () => {
      (capturedExpenseListViewProps.onSelectCategory as (id: string) => void)('c1');
    });

    // After selecting a category, the hook should re-fetch with filter
    await waitFor(() => {
      expect(mockClient.expenses.list).toHaveBeenCalledWith('t1', { categoryId: 'c1' });
    });
  });

  it('passes onNavigateToCategories to AddExpenseModal', async () => {
    const onNavigateToCategories = vi.fn();
    renderExpenseList({ onNavigateToCategories });

    await waitFor(() => {
      expect(capturedAddExpenseModalProps.onNavigateToCategories).toBe(onNavigateToCategories);
    });
  });

  it('calls onSuccess callback on successful save (not showToast)', async () => {
    const onSuccess = vi.fn();
    const { mockClient } = renderExpenseList({ onSuccess });

    // First select an expense to open the modal
    await waitFor(() => {
      expect(capturedExpenseListViewProps.onSelectExpense).toBeDefined();
    });

    // Select an expense to create (null means new)
    await act(async () => {
      (capturedExpenseListViewProps.onSelectExpense as (e: unknown) => void)({
        id: 'e1',
        travelId: 't1',
        categoryId: 'c1',
        memberId: 'm1',
        amount: 100,
        description: 'Lunch',
        date: '2026-01-02',
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      });
    });

    // Now the modal should be open, trigger save
    expect(capturedAddExpenseModalProps.onSave).toBeDefined();

    await act(async () => {
      (capturedAddExpenseModalProps.onSave as (data: unknown) => void)({
        description: 'Updated',
        amount: 200,
        categoryId: 'c1',
        memberId: 'm1',
        date: '2026-01-05',
      });
    });

    expect(mockClient.expenses.update).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('expense.updated');
  });
});
