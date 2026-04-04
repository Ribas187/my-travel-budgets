// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { ExpenseList } from './ExpenseList';

let capturedExpenseListViewProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  ExpenseListView: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
    capturedExpenseListViewProps = props;
    return <div data-testid="expense-list-view">{props.children}</div>;
  },
  AddExpenseModal: (props: Record<string, unknown>) => (
    <div data-testid="add-expense-modal-ui" />
  ),
  InlineTip: (props: Record<string, unknown>) => (
    <div data-testid={`inline-tip-${props.tipId}`} data-message={props.message}>
      {props.ctaLabel && (
        <button data-testid="tip-cta" onClick={props.onCtaPress as () => void}>
          {props.ctaLabel as string}
        </button>
      )}
      <button data-testid="dismiss-tip" onClick={props.onDismiss as () => void} />
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

const mockTravelNoCategories: TravelDetail = {
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

const mockTravelWithCategories: TravelDetail = {
  ...mockTravelNoCategories,
  categories: [
    { id: 'c1', travelId: 't1', name: 'Food', icon: '🍔', color: '#FF0000', budgetLimit: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  ],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.expenses.list = vi.fn().mockResolvedValue([]);
  client.expenses.create = vi.fn().mockResolvedValue({ id: 'new-e' });
  client.expenses.update = vi.fn().mockResolvedValue({ id: 'e1' });
  client.expenses.delete = vi.fn().mockResolvedValue({});
  client.dashboard.get = vi.fn().mockResolvedValue({
    currency: 'USD',
    overall: { totalBudget: 1000, totalSpent: 0, remaining: 1000, status: 'ok' as const },
    memberSpending: [],
    categorySpending: [],
  });
  return client;
}

function renderExpenseList(travel: TravelDetail, props: Partial<Parameters<typeof ExpenseList>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={travel} isOwner={true} currentUserId="u1">
            <ExpenseList {...props} />
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
  capturedExpenseListViewProps = {};
});

describe('ExpenseList — contextual tips', () => {
  it('shows InlineTip when no categories exist and tip not dismissed', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderExpenseList(mockTravelNoCategories);

    await waitFor(() => {
      expect(screen.getByTestId('inline-tip-expenses_no_categories')).toBeTruthy();
    });

    expect(screen.getByTestId('inline-tip-expenses_no_categories').getAttribute('data-message'))
      .toBe('onboarding.tip.expensesNoCategories');
  });

  it('does NOT show InlineTip when categories exist', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderExpenseList(mockTravelWithCategories);

    await waitFor(() => {
      expect(screen.getByTestId('expense-list-view')).toBeTruthy();
    });

    expect(screen.queryByTestId('inline-tip-expenses_no_categories')).toBeNull();
  });

  it('does NOT show InlineTip when tip is dismissed', async () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderExpenseList(mockTravelNoCategories);

    await waitFor(() => {
      expect(screen.getByTestId('expense-list-view')).toBeTruthy();
    });

    expect(screen.queryByTestId('inline-tip-expenses_no_categories')).toBeNull();
  });

  it('CTA navigates to categories page', async () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });
    const onNavigateToCategories = vi.fn();

    renderExpenseList(mockTravelNoCategories, { onNavigateToCategories });

    await waitFor(() => {
      expect(screen.getByTestId('tip-cta')).toBeTruthy();
    });

    screen.getByTestId('tip-cta').click();
    expect(onNavigateToCategories).toHaveBeenCalledOnce();
  });

  it('calls useTip with "expenses_no_categories"', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderExpenseList(mockTravelNoCategories);

    expect(mockUseTip).toHaveBeenCalledWith('expenses_no_categories');
  });
});
