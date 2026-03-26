// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';
import { queryKeys } from '../../queryKeys';
import { useTravels } from './useTravels';
import { useTravelDetail } from './useTravelDetail';
import { useTravelCategories } from './useTravelCategories';
import { useCreateTravel } from './useCreateTravel';
import { useUpdateTravel } from './useUpdateTravel';
import { useDeleteTravel } from './useDeleteTravel';

const mockTravels = [{ id: 't1', name: 'Trip 1' }];
const mockTravelDetail = {
  id: 't1',
  name: 'Trip 1',
  categories: [{ id: 'c1', name: 'Food' }],
  members: [],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });

  client.travels.list = vi.fn().mockResolvedValue(mockTravels);
  client.travels.get = vi.fn().mockResolvedValue(mockTravelDetail);
  client.travels.create = vi.fn().mockResolvedValue({ id: 't2', name: 'New Trip' });
  client.travels.update = vi.fn().mockResolvedValue({ id: 't1', name: 'Updated' });
  client.travels.delete = vi.fn().mockResolvedValue(undefined);

  return client;
}

function createWrapper(apiClient: ApiClient) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ApiClientProvider client={apiClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );
  };
}

describe('useTravels', () => {
  it('calls apiClient.travels.list() with correct queryKey', async () => {
    const mockClient = createMockClient();
    const wrapper = createWrapper(mockClient);

    const { result } = renderHook(() => useTravels(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.travels.list).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(mockTravels);
  });
});

describe('useTravelDetail', () => {
  it('uses queryKeys.travels.detail(id) and fetches travel', async () => {
    const mockClient = createMockClient();
    const wrapper = createWrapper(mockClient);

    const { result } = renderHook(() => useTravelDetail('t1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.travels.get).toHaveBeenCalledWith('t1');
    expect(result.current.data).toEqual(mockTravelDetail);
  });

  it('is disabled when travelId is empty', () => {
    const mockClient = createMockClient();
    const wrapper = createWrapper(mockClient);

    const { result } = renderHook(() => useTravelDetail(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockClient.travels.get).not.toHaveBeenCalled();
  });
});

describe('useTravelCategories', () => {
  it('extracts .categories from travel detail', async () => {
    const mockClient = createMockClient();
    const wrapper = createWrapper(mockClient);

    const { result } = renderHook(() => useTravelCategories('t1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([{ id: 'c1', name: 'Food' }]);
  });
});

describe('useCreateTravel', () => {
  it('invalidates queryKeys.travels.all on success', async () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );

    const { result } = renderHook(() => useCreateTravel(), { wrapper });

    result.current.mutate({ name: 'New', budget: 1000, currency: 'USD' as any, startDate: '2024-01-01', endDate: '2024-01-31' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.travels.all,
    });
  });
});

describe('useUpdateTravel', () => {
  it('invalidates queryKeys.travels.all and queryKeys.travels.detail(id) on success', async () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );

    const { result } = renderHook(() => useUpdateTravel('t1'), { wrapper });

    result.current.mutate({ name: 'Updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.travels.all,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.travels.detail('t1'),
    });
  });
});

describe('useDeleteTravel', () => {
  it('invalidates queryKeys.travels.all on success', async () => {
    const mockClient = createMockClient();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiClientProvider>
    );

    const { result } = renderHook(() => useDeleteTravel(), { wrapper });

    result.current.mutate('t1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.travels.all,
    });
  });
});
