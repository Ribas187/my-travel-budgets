// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';
import { queryKeys } from '../../queryKeys';
import { useUserMe } from './useUserMe';
import { useUpdateUser } from './useUpdateUser';
import { useSetMainTravel } from './useSetMainTravel';
import { useUploadAvatar } from './useUploadAvatar';
import { useRemoveAvatar } from './useRemoveAvatar';

const mockUser = { id: 'u1', email: 'user@test.com', name: 'Test', avatarUrl: null, mainTravelId: null, createdAt: '', updatedAt: '' };

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });

  client.users.getMe = vi.fn().mockResolvedValue(mockUser);
  client.users.updateMe = vi.fn().mockResolvedValue(mockUser);
  client.users.setMainTravel = vi.fn().mockResolvedValue(mockUser);
  client.users.uploadAvatar = vi.fn().mockResolvedValue(mockUser);
  client.users.removeAvatar = vi.fn().mockResolvedValue(mockUser);

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

describe('useUserMe', () => {
  it('calls apiClient.users.getMe() with queryKeys.users.me', async () => {
    const mockClient = createMockClient();
    const { wrapper } = createTestWrapper(mockClient);

    const { result } = renderHook(() => useUserMe(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.users.getMe).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(mockUser);
  });
});

describe('useUpdateUser', () => {
  it('invalidates queryKeys.users.me on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateUser(), { wrapper });

    result.current.mutate({ name: 'Updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.users.me });
  });
});

describe('useSetMainTravel', () => {
  it('invalidates queryKeys.users.me on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSetMainTravel(), { wrapper });

    result.current.mutate('t1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.users.me });
  });
});

describe('useUploadAvatar', () => {
  it('invalidates users.me and travels.all on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUploadAvatar(), { wrapper });

    result.current.mutate(new Blob(['test']));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.users.me });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.travels.all });
  });
});

describe('useRemoveAvatar', () => {
  it('invalidates users.me and travels.all on success', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRemoveAvatar(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.users.me });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.travels.all });
  });
});
