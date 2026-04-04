// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';

import { TripSummaryPage } from './TripSummaryPage';

vi.mock('@repo/ui', () => ({
  TripSummaryView: (props: Record<string, unknown>) => (
    <div data-testid="trip-summary-view" data-travel-id={(props.travel as TravelDetail)?.id} />
  ),
  InlineTip: (props: Record<string, unknown>) => (
    <div data-testid={`inline-tip-${props.tipId}`} data-message={props.message}>
      <button data-testid="dismiss-tip" onClick={props.onDismiss as () => void} />
    </div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockDismiss = vi.fn();
const mockUseTip = vi.fn();

vi.mock('../onboarding/useTip', () => ({
  useTip: (...args: unknown[]) => mockUseTip(...args),
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

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.dashboard.get = vi.fn().mockResolvedValue({
    currency: 'USD',
    overall: { totalBudget: 1000, totalSpent: 500, remaining: 500, status: 'ok' as const },
    memberSpending: [],
    categorySpending: [],
  });
  client.expenses.list = vi.fn().mockResolvedValue([]);
  return client;
}

function renderSummary() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return render(
    <ApiClientProvider client={mockClient}>
      <QueryClientProvider client={queryClient}>
        <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
          <TripSummaryPage />
        </TravelProvider>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('TripSummaryPage — contextual tips', () => {
  it('shows InlineTip when tip is not dismissed', () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderSummary();

    expect(screen.getByTestId('inline-tip-summary_first_visit')).toBeTruthy();
    expect(screen.getByTestId('inline-tip-summary_first_visit').getAttribute('data-message')).toBe(
      'onboarding.tip.summaryFirstVisit',
    );
  });

  it('does NOT show InlineTip when tip is dismissed', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderSummary();

    expect(screen.queryByTestId('inline-tip-summary_first_visit')).toBeNull();
  });

  it('calls useTip with "summary_first_visit"', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderSummary();

    expect(mockUseTip).toHaveBeenCalledWith('summary_first_visit');
  });
});
