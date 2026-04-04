// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { CategoriesPage } from './CategoriesPage';

let capturedViewProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  CategoriesView: (props: Record<string, unknown>) => {
    capturedViewProps = props;
    return <div data-testid="categories-view" />;
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

// Mock useCategoryForm to control expandedId
const mockHandleToggle = vi.fn();
const mockHandleCancel = vi.fn();
const mockHandleAddNew = vi.fn();
const mockHandleFormChange = vi.fn();
const mockSetDeleteTarget = vi.fn();

let mockExpandedId: string | null = null;

vi.mock('./useCategoryForm', () => ({
  useCategoryForm: () => ({
    form: { name: '', selectedEmoji: '📁', selectedColor: '#000', budgetLimit: '' },
    expandedId: mockExpandedId,
    deleteTarget: null,
    setDeleteTarget: mockSetDeleteTarget,
    handleToggle: mockHandleToggle,
    handleCancel: mockHandleCancel,
    handleAddNew: mockHandleAddNew,
    handleFormChange: mockHandleFormChange,
  }),
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
  categories: [
    { id: 'c1', travelId: 't1', name: 'Food', icon: '🍔', color: '#FF0000', budgetLimit: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  ],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.categories.create = vi.fn().mockResolvedValue({ id: 'new-c' });
  client.categories.update = vi.fn().mockResolvedValue({ id: 'c1' });
  client.categories.delete = vi.fn().mockResolvedValue({});
  client.expenses.list = vi.fn().mockResolvedValue([]);
  return client;
}

function renderCategories() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <CategoriesPage />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    ),
    mockClient,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockExpandedId = null;
});

afterEach(() => {
  cleanup();
  capturedViewProps = {};
});

describe('CategoriesPage — contextual tips', () => {
  it('shows TooltipTip when editing an existing category and tip not dismissed', () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });
    mockExpandedId = 'c1'; // editing existing category

    renderCategories();

    expect(screen.getByTestId('tooltip-tip-category_budget_limit')).toBeTruthy();
    expect(screen.getByTestId('tooltip-tip-category_budget_limit').getAttribute('data-message'))
      .toBe('onboarding.tip.categoryBudgetLimit');
  });

  it('does NOT show TooltipTip when not editing a category', () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });
    mockExpandedId = null; // not editing

    renderCategories();

    expect(screen.queryByTestId('tooltip-tip-category_budget_limit')).toBeNull();
  });

  it('does NOT show TooltipTip when adding a new category (expandedId = "new")', () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });
    mockExpandedId = 'new'; // creating new, not editing existing

    renderCategories();

    expect(screen.queryByTestId('tooltip-tip-category_budget_limit')).toBeNull();
  });

  it('does NOT show TooltipTip when tip is dismissed', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });
    mockExpandedId = 'c1';

    renderCategories();

    expect(screen.queryByTestId('tooltip-tip-category_budget_limit')).toBeNull();
  });

  it('calls useTip with "category_budget_limit"', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderCategories();

    expect(mockUseTip).toHaveBeenCalledWith('category_budget_limit');
  });
});
