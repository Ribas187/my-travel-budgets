// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { CategoriesPage } from './CategoriesPage';

let capturedProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  CategoriesView: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="categories-view" />;
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
  categories: [
    { id: 'c1', travelId: 't1', name: 'Food', icon: '🍕', color: '#FF0000', budgetLimit: 300, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'c2', travelId: 't1', name: 'Transport', icon: '🚗', color: '#0000FF', budgetLimit: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  ],
};

const mockExpenses = [
  { id: 'e1', travelId: 't1', categoryId: 'c1', memberId: 'm1', amount: 50, description: 'Lunch', date: '2026-01-02', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
  { id: 'e2', travelId: 't1', categoryId: 'c1', memberId: 'm1', amount: 30, description: 'Dinner', date: '2026-01-03', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' },
  { id: 'e3', travelId: 't1', categoryId: 'c2', memberId: 'm1', amount: 20, description: 'Taxi', date: '2026-01-03', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' },
];

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.categories.create = vi.fn().mockResolvedValue({ id: 'new-c' });
  client.categories.update = vi.fn().mockResolvedValue({ id: 'c1' });
  client.categories.delete = vi.fn().mockResolvedValue(undefined);
  client.expenses.list = vi.fn().mockResolvedValue(mockExpenses);
  return client;
}

function renderCategoriesPage(props: Partial<Parameters<typeof CategoriesPage>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <CategoriesPage {...props} />
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

describe('CategoriesPage', () => {
  it('calls onSuccess after creating a category', async () => {
    const onSuccess = vi.fn();
    renderCategoriesPage({ onSuccess });

    await waitFor(() => {
      expect(capturedProps.onAddNew).toBeDefined();
    });

    // Click add new
    act(() => {
      (capturedProps.onAddNew as () => void)();
    });

    // Fill form
    act(() => {
      (capturedProps.onFormChange as (u: Record<string, unknown>) => void)({ name: 'New Category' });
    });

    // Save
    await act(async () => {
      (capturedProps.onSave as () => void)();
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('category.created');
    });
  });

  it('tracks expense count per category for delete confirmation', async () => {
    renderCategoriesPage();

    // Wait for expenses to load
    await waitFor(() => {
      expect(capturedProps.categories).toBeDefined();
    });

    // Request delete for c1 (has 2 expenses)
    act(() => {
      (capturedProps.onDeleteRequest as (cat: unknown) => void)(mockTravel.categories![0]);
    });

    await waitFor(() => {
      expect(capturedProps.deleteTarget).toEqual(mockTravel.categories![0]);
      expect(capturedProps.deleteExpenseCount).toBe(2);
    });
  });

  it('passes categories and isOwner from travel context', async () => {
    renderCategoriesPage();

    await waitFor(() => {
      expect(capturedProps.categories).toEqual(mockTravel.categories);
      expect(capturedProps.isOwner).toBe(true);
    });
  });
});
