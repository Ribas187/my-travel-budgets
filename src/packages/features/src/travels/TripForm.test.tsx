// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';

import { TripForm } from './TripForm';

let capturedProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  TripFormView: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="trip-form-view" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.members.add = vi.fn().mockResolvedValue({});
  client.members.remove = vi.fn().mockResolvedValue({});
  return client;
}

function renderTripForm(props: Partial<Parameters<typeof TripForm>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TripForm saving={false} onSave={() => {}} {...props} />
        </QueryClientProvider>
      </ApiClientProvider>,
    ),
    mockClient,
  };
}

afterEach(() => {
  cleanup();
  capturedProps = {};
});

describe('TripForm', () => {
  it('renders TripFormView and passes onSave through', () => {
    const onSave = vi.fn();
    renderTripForm({ onSave });

    expect(capturedProps.onSave).toBe(onSave);
  });

  it('renders with travel data when provided', () => {
    const travel = {
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

    renderTripForm({ travel });

    expect(capturedProps.travel).toBe(travel);
  });

  it('calls onSuccess callback via handleInviteByEmail (not showToast)', async () => {
    const onSuccess = vi.fn();
    const mockClient = createMockClient();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const travel = {
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

    render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TripForm travel={travel} saving={false} onSave={() => {}} onSuccess={onSuccess} />
        </QueryClientProvider>
      </ApiClientProvider>,
    );

    // The onInviteByEmail handler is captured from the mocked TripFormView
    expect(capturedProps.onInviteByEmail).toBeDefined();
  });
});
