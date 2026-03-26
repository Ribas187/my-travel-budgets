// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { BudgetBreakdownPage } from './BudgetBreakdownPage';
import { getExpenseCountByCategory } from './BudgetBreakdownPage';

let capturedOnManageCategories: (() => void) | undefined;

vi.mock('@repo/ui', () => ({
  BudgetBreakdownView: (props: Record<string, unknown>) => {
    capturedOnManageCategories = props.onManageCategories as () => void;
    return (
      <div
        data-testid="budget-breakdown-view"
        data-loading={String(props.isLoading)}
      />
    );
  },
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
  categorySpending: [],
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
    categoryId: 'c1',
    memberId: 'm1',
    amount: 50,
    description: 'Coffee',
    date: '2026-01-02',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'e3',
    travelId: 't1',
    categoryId: 'c2',
    memberId: 'm1',
    amount: 200,
    description: 'Hotel',
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

  client.dashboard.get = vi.fn().mockResolvedValue(mockDashboard);
  client.expenses.list = vi.fn().mockResolvedValue(mockExpenses);

  return client;
}

describe('getExpenseCountByCategory', () => {
  it('computes expense counts by category correctly', () => {
    const counts = getExpenseCountByCategory(mockExpenses);
    expect(counts).toEqual({ c1: 2, c2: 1 });
  });

  it('returns empty object for no expenses', () => {
    expect(getExpenseCountByCategory([])).toEqual({});
  });
});

afterEach(() => {
  cleanup();
});

describe('BudgetBreakdownPage', () => {
  it('calls onManageCategories callback when triggered from view', async () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const onManageCategories = vi.fn();

    render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <BudgetBreakdownPage onManageCategories={onManageCategories} />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    );

    await waitFor(() => {
      expect(mockClient.dashboard.get).toHaveBeenCalledWith('t1');
    });

    // The mocked BudgetBreakdownView captures the onManageCategories prop
    expect(capturedOnManageCategories).toBeDefined();
    capturedOnManageCategories!();
    expect(onManageCategories).toHaveBeenCalledOnce();
  });

  it('fetches data hooks with correct travel id', async () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { getByTestId } = render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <BudgetBreakdownPage onManageCategories={() => {}} />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    );

    await waitFor(() => {
      expect(mockClient.dashboard.get).toHaveBeenCalledWith('t1');
      expect(mockClient.expenses.list).toHaveBeenCalledWith('t1', undefined);
    });

    expect(getByTestId('budget-breakdown-view')).toBeTruthy();
  });
});
