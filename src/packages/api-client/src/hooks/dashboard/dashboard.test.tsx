// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';
import { useDashboard } from './useDashboard';

const mockDashboard = {
  currency: 'USD',
  overall: { totalBudget: 1000, totalSpent: 500, remaining: 500, status: 'ok' as const },
  memberSpending: [],
  categorySpending: [],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });

  client.dashboard.get = vi.fn().mockResolvedValue(mockDashboard);

  return client;
}

describe('useDashboard', () => {
  it('uses queryKeys.dashboard.get(travelId) and fetches dashboard', async () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );

    const { result } = renderHook(() => useDashboard('t1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.dashboard.get).toHaveBeenCalledWith('t1');
    expect(result.current.data).toEqual(mockDashboard);
  });

  it('is disabled when travelId is empty', () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );

    const { result } = renderHook(() => useDashboard(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockClient.dashboard.get).not.toHaveBeenCalled();
  });
});
