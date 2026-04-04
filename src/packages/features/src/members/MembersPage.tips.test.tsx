// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { MembersPage } from './MembersPage';

vi.mock('@repo/ui', () => ({
  MembersView: (props: Record<string, unknown>) => (
    <div data-testid="members-view" />
  ),
  TooltipTip: (props: Record<string, unknown>) => (
    <div data-testid={`tooltip-tip-${props.tipId}`} data-message={props.message}>
      <button data-testid="dismiss-tip" onClick={props.onDismiss as () => void}>
        {props.dismissLabel as string}
      </button>
    </div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockDismiss = vi.fn();
const mockUseTip = vi.fn();

vi.mock('../onboarding/useTip', () => ({
  useTip: (...args: unknown[]) => mockUseTip(...args),
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
  categories: [],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.dashboard.get = vi.fn().mockResolvedValue({
    currency: 'USD',
    overall: { totalBudget: 1000, totalSpent: 0, remaining: 1000, status: 'ok' as const },
    memberSpending: [],
    categorySpending: [],
  });
  client.members.add = vi.fn().mockResolvedValue({ id: 'm2' });
  client.members.remove = vi.fn().mockResolvedValue(undefined);
  return client;
}

function renderMembers() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return render(
    <ApiClientProvider client={mockClient}>
      <QueryClientProvider client={queryClient}>
        <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
          <MembersPage />
        </TravelProvider>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('MembersPage — contextual tips', () => {
  it('shows TooltipTip when tip is not dismissed', () => {
    mockUseTip.mockReturnValue({ shouldShow: true, dismiss: mockDismiss });

    renderMembers();

    expect(screen.getByTestId('tooltip-tip-members_invite_button')).toBeTruthy();
    expect(screen.getByTestId('tooltip-tip-members_invite_button').getAttribute('data-message'))
      .toBe('onboarding.tip.membersInviteButton');
  });

  it('does NOT show TooltipTip when tip is dismissed', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderMembers();

    expect(screen.queryByTestId('tooltip-tip-members_invite_button')).toBeNull();
  });

  it('calls useTip with "members_invite_button"', () => {
    mockUseTip.mockReturnValue({ shouldShow: false, dismiss: mockDismiss });

    renderMembers();

    expect(mockUseTip).toHaveBeenCalledWith('members_invite_button');
  });
});
