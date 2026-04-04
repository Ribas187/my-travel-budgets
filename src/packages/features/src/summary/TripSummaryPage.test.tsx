// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';

import { TripSummaryPage } from './TripSummaryPage';

vi.mock('@repo/ui', () => ({
  TripSummaryView: (props: Record<string, unknown>) => (
    <div data-testid="trip-summary-view" data-travel-id={(props.travel as TravelDetail)?.id} />
  ),
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

describe('TripSummaryPage', () => {
  it('renders with travel context and data hooks', async () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { getByTestId } = render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <TripSummaryPage />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    );

    await waitFor(() => {
      expect(mockClient.dashboard.get).toHaveBeenCalledWith('t1');
      expect(mockClient.expenses.list).toHaveBeenCalledWith('t1', undefined);
    });

    expect(getByTestId('trip-summary-view')).toBeTruthy();
    expect(getByTestId('trip-summary-view').getAttribute('data-travel-id')).toBe('t1');
  });
});
