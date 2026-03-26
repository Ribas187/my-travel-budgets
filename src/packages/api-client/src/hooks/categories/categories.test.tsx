// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';
import { queryKeys } from '../../queryKeys';
import { useCreateCategory } from './useCreateCategory';
import { useUpdateCategory } from './useUpdateCategory';
import { useDeleteCategory } from './useDeleteCategory';

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });

  client.categories.create = vi.fn().mockResolvedValue({ id: 'c1', name: 'Food' });
  client.categories.update = vi.fn().mockResolvedValue({ id: 'c1', name: 'Updated' });
  client.categories.delete = vi.fn().mockResolvedValue(undefined);

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

const expectedInvalidations = [
  { queryKey: queryKeys.categories.list('t1') },
  { queryKey: queryKeys.dashboard.get('t1') },
  { queryKey: queryKeys.travels.detail('t1') },
];

describe('useCreateCategory', () => {
  it('invalidates categories.list, dashboard.get, and travels.detail on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCategory('t1'), { wrapper });

    result.current.mutate({ name: 'Food', icon: '🍔', color: '#ff0000' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    for (const expected of expectedInvalidations) {
      expect(invalidateSpy).toHaveBeenCalledWith(expected);
    }
  });
});

describe('useUpdateCategory', () => {
  it('invalidates categories.list, dashboard.get, and travels.detail on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCategory('t1'), { wrapper });

    result.current.mutate({ catId: 'c1', data: { name: 'Updated' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    for (const expected of expectedInvalidations) {
      expect(invalidateSpy).toHaveBeenCalledWith(expected);
    }
  });
});

describe('useDeleteCategory', () => {
  it('invalidates categories.list, dashboard.get, and travels.detail on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCategory('t1'), { wrapper });

    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    for (const expected of expectedInvalidations) {
      expect(invalidateSpy).toHaveBeenCalledWith(expected);
    }
  });
});
