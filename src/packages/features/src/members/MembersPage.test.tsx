// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { MembersPage } from './MembersPage';

let capturedProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  MembersView: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="members-view" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
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
  members: [
    { id: 'm1', travelId: 't1', userId: 'u1', guestName: null, role: 'owner' as const, user: { id: 'u1', name: 'Alice', email: 'alice@test.com', avatarUrl: null, mainTravelId: null, onboardingCompletedAt: '2026-01-01T00:00:00Z', dismissedTips: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'm2', travelId: 't1', userId: 'u2', guestName: null, role: 'member' as const, user: { id: 'u2', name: 'Bob', email: 'bob@test.com', avatarUrl: null, mainTravelId: null, onboardingCompletedAt: '2026-01-01T00:00:00Z', dismissedTips: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  ],
  categories: [],
};

const mockDashboard = {
  currency: 'USD',
  overall: { totalBudget: 1000, totalSpent: 300, remaining: 700, status: 'ok' as const },
  memberSpending: [
    { memberId: 'm1', displayName: 'Alice', totalSpent: 200 },
    { memberId: 'm2', displayName: 'Bob', totalSpent: 100 },
  ],
  categorySpending: [],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.dashboard.get = vi.fn().mockResolvedValue(mockDashboard);
  client.members.add = vi.fn().mockResolvedValue({ id: 'm3' });
  client.members.remove = vi.fn().mockResolvedValue(undefined);
  return client;
}

function renderMembersPage(props: Partial<Parameters<typeof MembersPage>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <MembersPage {...props} />
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

describe('MembersPage', () => {
  it('computes memberSpendingMap from dashboard data', async () => {
    renderMembersPage();

    await waitFor(() => {
      const spendingMap = capturedProps.memberSpendingMap as Map<string, unknown>;
      expect(spendingMap).toBeInstanceOf(Map);
      expect(spendingMap.size).toBe(2);
      expect(spendingMap.get('m1')).toEqual(mockDashboard.memberSpending[0]);
      expect(spendingMap.get('m2')).toEqual(mockDashboard.memberSpending[1]);
    });
  });

  it('calls onSuccess after adding a member by email', async () => {
    const onSuccess = vi.fn();
    renderMembersPage({ onSuccess });

    await waitFor(() => {
      expect(capturedProps.onInviteByEmail).toBeDefined();
    });

    await act(async () => {
      (capturedProps.onInviteByEmail as (email: string) => void)('new@test.com');
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('member.added');
    });
  });

  it('calls onSuccess after adding a guest', async () => {
    const onSuccess = vi.fn();
    renderMembersPage({ onSuccess });

    await waitFor(() => {
      expect(capturedProps.onAddGuest).toBeDefined();
    });

    await act(async () => {
      (capturedProps.onAddGuest as (name: string) => void)('Guest Name');
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('member.added');
    });
  });

  it('calls onSuccess after removing a member', async () => {
    const onSuccess = vi.fn();
    renderMembersPage({ onSuccess });

    await waitFor(() => {
      expect(capturedProps.onRemoveRequest).toBeDefined();
    });

    // Set member to remove
    act(() => {
      (capturedProps.onRemoveRequest as (m: unknown) => void)(mockTravel.members[1]);
    });

    // Confirm removal
    await act(async () => {
      (capturedProps.onRemoveConfirm as () => void)();
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('member.removed');
    });
  });

  it('passes members and currency from travel context', async () => {
    renderMembersPage();

    await waitFor(() => {
      expect(capturedProps.members).toEqual(mockTravel.members);
      expect(capturedProps.currency).toBe('USD');
      expect(capturedProps.isOwner).toBe(true);
    });
  });
});
