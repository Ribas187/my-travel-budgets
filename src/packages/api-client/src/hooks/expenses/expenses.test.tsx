// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';
import { queryKeys } from '../../queryKeys';
import { useTravelExpenses } from './useTravelExpenses';
import { useCreateExpense } from './useCreateExpense';
import { useUpdateExpense } from './useUpdateExpense';
import { useDeleteExpense } from './useDeleteExpense';
import { useBudgetImpact } from './useBudgetImpact';

const mockExpenses = [
  { id: 'e1', categoryId: 'c1', memberId: 'm1', amount: 50, description: 'Lunch', date: '2024-01-15' },
];

const mockDashboard = {
  currency: 'USD',
  overall: { totalBudget: 1000, totalSpent: 500, remaining: 500, status: 'ok' as const },
  memberSpending: [],
  categorySpending: [
    { categoryId: 'c1', name: 'Food', icon: '🍔', color: '#ff0000', totalSpent: 60, budgetLimit: 100, status: 'ok' as const },
    { categoryId: 'c2', name: 'Transport', icon: '🚗', color: '#0000ff', totalSpent: 0, budgetLimit: null, status: 'ok' as const },
  ],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });

  client.expenses.list = vi.fn().mockResolvedValue(mockExpenses);
  client.expenses.create = vi.fn().mockResolvedValue({ id: 'e2' });
  client.expenses.update = vi.fn().mockResolvedValue({ id: 'e1' });
  client.expenses.delete = vi.fn().mockResolvedValue(undefined);
  client.dashboard.get = vi.fn().mockResolvedValue(mockDashboard);

  return client;
}

function createTestWrapper(apiClient: ApiClient, queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    queryClient: qc,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={apiClient}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </ApiClientProvider>
    ),
  };
}

describe('useTravelExpenses', () => {
  it('calls apiClient.expenses.list(travelId, filters) with correct queryKey', async () => {
    const mockClient = createMockClient();
    const { wrapper } = createTestWrapper(mockClient);

    const { result } = renderHook(() => useTravelExpenses('t1', { categoryId: 'c1' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.expenses.list).toHaveBeenCalledWith('t1', { categoryId: 'c1' });
    expect(result.current.data).toEqual(mockExpenses);
  });

  it('is disabled when travelId is empty', () => {
    const mockClient = createMockClient();
    const { wrapper } = createTestWrapper(mockClient);

    const { result } = renderHook(() => useTravelExpenses(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockClient.expenses.list).not.toHaveBeenCalled();
  });
});

describe('useCreateExpense', () => {
  it('invalidates expenses.list(travelId) and dashboard.get(travelId) on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateExpense('t1'), { wrapper });

    result.current.mutate({ categoryId: 'c1', memberId: 'm1', amount: 25, description: 'Test', date: '2024-01-15' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.expenses.list('t1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.get('t1') });
  });
});

describe('useUpdateExpense', () => {
  it('invalidates expenses.list, dashboard.get, and travels.detail on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateExpense('t1'), { wrapper });

    result.current.mutate({ expenseId: 'e1', data: { amount: 75 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.expenses.list('t1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.get('t1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.travels.detail('t1') });
  });
});

describe('useDeleteExpense', () => {
  it('invalidates expenses.list, dashboard.get, and travels.detail on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteExpense('t1'), { wrapper });

    result.current.mutate('e1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.expenses.list('t1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.get('t1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.travels.detail('t1') });
  });
});

describe('useBudgetImpact', () => {
  it('returns level: none when amount is 0 or below', async () => {
    const mockClient = createMockClient();
    const { wrapper } = createTestWrapper(mockClient);

    const { result } = renderHook(() => useBudgetImpact('t1', 'c1', 0), { wrapper });

    expect(result.current.level).toBe('none');
  });

  it('returns level: none below 70%', async () => {
    const mockClient = createMockClient();
    const { wrapper } = createTestWrapper(mockClient);

    // totalSpent=60, budgetLimit=100, amount=5 → 65% → none
    const { result } = renderHook(() => useBudgetImpact('t1', 'c1', 5), { wrapper });

    await waitFor(() => expect(result.current.percentageAfter).toBe(65));

    expect(result.current.level).toBe('none');
  });

  it('returns level: warning at 70%+', async () => {
    const mockClient = createMockClient();
    const { wrapper } = createTestWrapper(mockClient);

    // totalSpent=60, budgetLimit=100, amount=10 → 70% → warning
    const { result } = renderHook(() => useBudgetImpact('t1', 'c1', 10), { wrapper });

    await waitFor(() => expect(result.current.percentageAfter).toBe(70));

    expect(result.current.level).toBe('warning');
  });

  it('returns level: danger at 100%+', async () => {
    const mockClient = createMockClient();
    const { wrapper } = createTestWrapper(mockClient);

    // totalSpent=60, budgetLimit=100, amount=40 → 100% → danger
    const { result } = renderHook(() => useBudgetImpact('t1', 'c1', 40), { wrapper });

    await waitFor(() => expect(result.current.percentageAfter).toBe(100));

    expect(result.current.level).toBe('danger');
  });
});
