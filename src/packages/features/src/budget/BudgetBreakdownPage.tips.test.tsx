// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { BudgetBreakdownPage } from './BudgetBreakdownPage';

let capturedViewProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  BudgetBreakdownView: (props: Record<string, unknown>) => {
    capturedViewProps = props;
    return <div data-testid="budget-breakdown-view" />;
  },
  TooltipTip: (props: Record<string, unknown>) => (
    <div data-testid={`tooltip-tip-${props.tipId}`} data-message={props.message}>
      <button data-testid="dismiss-tip" onClick={props.onDismiss as () => void}>
        {props.dismissLabel as string}
      </button>
    </div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

const mockExpenses = [
  { id: 'e1', travelId: 't1', categoryId: 'c1', memberId: 'm1', amount: 100, description: 'Lunch', date: '2026-01-02', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
];

function createMockClient(expenses: unknown[] = []) {
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
  client.expenses.list = vi.fn().mockResolvedValue(expenses);
  return client;
}

function renderBudget(expenses: unknown[] = []) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient(expenses);

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <BudgetBreakdownPage onManageCategories={() => {}} />
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
  capturedViewProps = {};
});

describe('BudgetBreakdownPage — contextual tips', () => {
  it('shows TooltipTip when there are expenses and tip not dismissed', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderBudget(mockExpenses);

    await waitFor(() => {
      expect(screen.getByTestId('tooltip-tip-budget_progress_bar')).toBeTruthy();
    });

    expect(screen.getByTestId('tooltip-tip-budget_progress_bar').getAttribute('data-message'))
      .toBe('onboarding.tip.budgetProgressBar');
  });

  it('does NOT show TooltipTip when no expenses', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderBudget([]);

    await waitFor(() => {
      expect(screen.getByTestId('budget-breakdown-view')).toBeTruthy();
    });

    expect(screen.queryByTestId('tooltip-tip-budget_progress_bar')).toBeNull();
  });

  it('does NOT show TooltipTip when tip is dismissed', async () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderBudget(mockExpenses);

    await waitFor(() => {
      expect(screen.getByTestId('budget-breakdown-view')).toBeTruthy();
    });

    expect(screen.queryByTestId('tooltip-tip-budget_progress_bar')).toBeNull();
  });

  it('calls useTip with "budget_progress_bar"', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderBudget();

    expect(mockUseTip).toHaveBeenCalledWith('budget_progress_bar');
  });
});
