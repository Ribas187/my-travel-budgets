// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, waitFor, cleanup, screen } from '@testing-library/react';
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

const emptyDashboard = {
  currency: 'USD',
  overall: { totalBudget: 1000, totalSpent: 0, remaining: 1000, status: 'ok' as const },
  memberSpending: [],
  categorySpending: [],
};

const dashboardWithExpenses = {
  currency: 'USD',
  overall: { totalBudget: 1000, totalSpent: 500, remaining: 500, status: 'ok' as const },
  memberSpending: [],
  categorySpending: [],
};

function createMockClient(dashboard = emptyDashboard, expenses: unknown[] = []) {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.dashboard.get = vi.fn().mockResolvedValue(dashboard);
  client.expenses.list = vi.fn().mockResolvedValue(expenses);
  return client;
}

function renderDashboard(overrides?: { dashboard?: typeof emptyDashboard; expenses?: unknown[] }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient(overrides?.dashboard, overrides?.expenses);

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <DashboardPage onSeeAllCategories={() => {}} onViewAllExpenses={() => {}} />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    ),
    mockClient,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  capturedProps = {};
});

describe('DashboardPage — contextual tips', () => {
  it('shows InlineTip when user has 0 expenses and tip is not dismissed', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderDashboard();

    await waitFor(() => {
      expect(capturedProps.isEmpty).toBe(true);
    });

    expect(screen.getByTestId('inline-tip-dashboard_first_visit')).toBeTruthy();
    expect(screen.getByTestId('inline-tip-dashboard_first_visit').getAttribute('data-message'))
      .toBe('onboarding.tip.dashboardFirstVisit');
  });

  it('does NOT show InlineTip when tip is dismissed', async () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderDashboard();

    await waitFor(() => {
      expect(capturedProps.isEmpty).toBe(true);
    });

    expect(screen.queryByTestId('inline-tip-dashboard_first_visit')).toBeNull();
  });

  it('does NOT show InlineTip when there are expenses (isEmpty is false)', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    const expenses = [
      { id: 'e1', travelId: 't1', categoryId: 'c1', memberId: 'm1', amount: 100, description: 'Lunch', date: '2026-01-02', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ];

    renderDashboard({ dashboard: dashboardWithExpenses, expenses });

    await waitFor(() => {
      expect(capturedProps.isEmpty).toBe(false);
    });

    expect(screen.queryByTestId('inline-tip-dashboard_first_visit')).toBeNull();
  });

  it('calls useTip with "dashboard_first_visit"', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderDashboard();

    expect(mockUseTip).toHaveBeenCalledWith('dashboard_first_visit');
  });

  it('dismiss callback is wired to the tip', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderDashboard();

    await waitFor(() => {
      expect(capturedProps.isEmpty).toBe(true);
    });

    screen.getByTestId('dismiss-tip').click();
    expect(mockDismiss).toHaveBeenCalledOnce();
  });
});
