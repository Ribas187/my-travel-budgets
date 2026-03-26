// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { DashboardPage } from './DashboardPage';

let capturedProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  DashboardTemplate: (props: Record<string, unknown>) => {
    capturedProps = props;
    return (
      <div
        data-testid="dashboard-template"
        data-loading={String(props.isLoading)}
        data-empty={String(props.isEmpty)}
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
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
  {
    id: 'e2',
    travelId: 't1',
    categoryId: 'c1',
    memberId: 'm1',
    amount: 50,
    description: 'Coffee',
    date: '2026-01-02',
    createdAt: '2026-01-04T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
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

function renderDashboard(props: { onSeeAllCategories: () => void; onViewAllExpenses: () => void }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <DashboardPage {...props} />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    ),
    mockClient,
  };
}

afterEach(() => {
  cleanup();
  capturedProps = {};
});

describe('DashboardPage', () => {
  it('calls onSeeAllCategories callback when triggered from template', async () => {
    const onSeeAllCategories = vi.fn();
    const onViewAllExpenses = vi.fn();

    renderDashboard({ onSeeAllCategories, onViewAllExpenses });

    await waitFor(() => {
      expect(capturedProps.onSeeAllCategories).toBeDefined();
    });

    (capturedProps.onSeeAllCategories as () => void)();
    expect(onSeeAllCategories).toHaveBeenCalledOnce();
  });

  it('calls onViewAllExpenses callback when triggered from template', async () => {
    const onSeeAllCategories = vi.fn();
    const onViewAllExpenses = vi.fn();

    renderDashboard({ onSeeAllCategories, onViewAllExpenses });

    await waitFor(() => {
      expect(capturedProps.onViewAllExpenses).toBeDefined();
    });

    (capturedProps.onViewAllExpenses as () => void)();
    expect(onViewAllExpenses).toHaveBeenCalledOnce();
  });

  it('computes isEmpty correctly when totalSpent is 0 and no expenses', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const mockClient = new ApiClient({
      baseUrl: 'http://localhost:3000',
      getToken: () => 'test-token',
    });
    mockClient.dashboard.get = vi.fn().mockResolvedValue({
      ...mockDashboard,
      overall: { ...mockDashboard.overall, totalSpent: 0 },
    });
    mockClient.expenses.list = vi.fn().mockResolvedValue([]);

    render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <DashboardPage onSeeAllCategories={() => {}} onViewAllExpenses={() => {}} />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    );

    await waitFor(() => {
      expect(capturedProps.isEmpty).toBe(true);
    });
  });

  it('computes recentExpenses sorted by createdAt descending', async () => {
    renderDashboard({ onSeeAllCategories: () => {}, onViewAllExpenses: () => {} });

    await waitFor(() => {
      const recent = capturedProps.recentExpenses as typeof mockExpenses;
      expect(recent).toHaveLength(2);
      expect(recent[0].id).toBe('e2'); // newer createdAt comes first
      expect(recent[1].id).toBe('e1');
    });
  });
});
