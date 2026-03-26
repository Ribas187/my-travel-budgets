// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';
import { queryKeys } from '../../queryKeys';
import { useAddMember } from './useAddMember';
import { useRemoveMember } from './useRemoveMember';

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });

  client.members.add = vi.fn().mockResolvedValue({ id: 'm1' });
  client.members.remove = vi.fn().mockResolvedValue(undefined);

  return client;
}

function createTestWrapper(apiClient: ApiClient) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={apiClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    ),
  };
}

describe('useAddMember', () => {
  it('invalidates travels.detail(travelId) on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddMember('t1'), { wrapper });

    result.current.mutate({ email: 'user@test.com' } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.travels.detail('t1'),
    });
  });
});

describe('useRemoveMember', () => {
  it('invalidates travels.detail(travelId) on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRemoveMember('t1'), { wrapper });

    result.current.mutate('m1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.travels.detail('t1'),
    });
  });
});
