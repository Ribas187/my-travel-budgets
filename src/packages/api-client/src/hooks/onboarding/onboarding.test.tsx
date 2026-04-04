// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';
import { queryKeys } from '../../queryKeys';
import type { UserMe } from '../../types';
import { useCompleteOnboarding } from './useCompleteOnboarding';
import { useDismissTip } from './useDismissTip';
import { useResetTips } from './useResetTips';

const mockUser: UserMe = {
  id: 'u1',
  email: 'user@test.com',
  name: 'Test',
  avatarUrl: null,
  mainTravelId: null,
  onboardingCompletedAt: null,
  dismissedTips: [],
  createdAt: '',
  updatedAt: '',
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });

  client.onboarding.complete = vi.fn().mockResolvedValue(undefined);
  client.onboarding.dismissTip = vi.fn().mockResolvedValue(undefined);
  client.onboarding.resetTips = vi.fn().mockResolvedValue(undefined);

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

describe('useCompleteOnboarding', () => {
  it('calls apiClient.onboarding.complete() and invalidates users.me', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCompleteOnboarding(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.onboarding.complete).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.users.me });
  });
});

describe('useDismissTip', () => {
  it('calls apiClient.onboarding.dismissTip(tipId) and invalidates users.me', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDismissTip(), { wrapper });

    result.current.mutate('dashboard_first_visit');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.onboarding.dismissTip).toHaveBeenCalledWith('dashboard_first_visit');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.users.me });
  });

  it('optimistically updates the users.me cache with the dismissed tip', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);

    // Seed the cache with the mock user
    queryClient.setQueryData<UserMe>(queryKeys.users.me, mockUser);

    const { result } = renderHook(() => useDismissTip(), { wrapper });

    result.current.mutate('dashboard_first_visit');

    // Check optimistic update happened before mutation settles
    await waitFor(() => {
      const cachedUser = queryClient.getQueryData<UserMe>(queryKeys.users.me);
      expect(cachedUser?.dismissedTips).toContain('dashboard_first_visit');
    });
  });

  it('reverts optimistic update on error', async () => {
    const mockClient = createMockClient();
    mockClient.onboarding.dismissTip = vi.fn().mockRejectedValue(new Error('Network error'));
    const { wrapper, queryClient } = createTestWrapper(mockClient);

    // Seed the cache with the mock user
    queryClient.setQueryData<UserMe>(queryKeys.users.me, mockUser);

    const { result } = renderHook(() => useDismissTip(), { wrapper });

    result.current.mutate('dashboard_first_visit');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cachedUser = queryClient.getQueryData<UserMe>(queryKeys.users.me);
    expect(cachedUser?.dismissedTips).toEqual([]);
  });
});

describe('useResetTips', () => {
  it('calls apiClient.onboarding.resetTips() and invalidates users.me', async () => {
    const mockClient = createMockClient();
    const { wrapper, queryClient } = createTestWrapper(mockClient);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useResetTips(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockClient.onboarding.resetTips).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.users.me });
  });
});
