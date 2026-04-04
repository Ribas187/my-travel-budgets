// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';

import { OnboardingWizard } from './OnboardingWizard';

// Track what views are rendered and their props
let welcomeProps: Record<string, unknown> = {};
let tripFormProps: Record<string, unknown> = {};
let categoriesProps: Record<string, unknown> = {};
let readyProps: Record<string, unknown> = {};
let progressBarProps: Record<string, unknown> = {};

vi.mock('tamagui', () => ({
  YStack: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid={props.testID as string}>{children as React.ReactNode}</div>
  ),
}));

vi.mock('@repo/ui', () => ({
  OnboardingWelcomeView: (props: Record<string, unknown>) => {
    welcomeProps = props;
    return <div data-testid="welcome-view" />;
  },
  OnboardingTripFormView: (props: Record<string, unknown>) => {
    tripFormProps = props;
    return <div data-testid="trip-form-view" />;
  },
  OnboardingCategoriesView: (props: Record<string, unknown>) => {
    categoriesProps = props;
    return <div data-testid="categories-view" />;
  },
  OnboardingReadyView: (props: Record<string, unknown>) => {
    readyProps = props;
    return <div data-testid="ready-view" />;
  },
  OnboardingProgressBar: (props: Record<string, unknown>) => {
    progressBarProps = props;
    return <div data-testid="progress-bar" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}:${JSON.stringify(params)}`;
    }
    return key;
  }}),
}));

const mockUser = {
  id: 'u1',
  email: 'test@test.com',
  name: '',
  avatarUrl: null,
  mainTravelId: null,
  onboardingCompletedAt: null,
  dismissedTips: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockTravel = {
  id: 't1',
  name: 'My First Trip',
  description: 'A trip',
  imageUrl: null,
  currency: 'USD',
  budget: 1000,
  startDate: '2026-01-01',
  endDate: '2026-01-08',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockCategory = {
  id: 'c1',
  travelId: 't1',
  name: 'Food',
  icon: '🍔',
  color: '#E53E3E',
  budgetLimit: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function createMockClient(userOverrides?: Partial<typeof mockUser>) {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.users.getMe = vi.fn().mockResolvedValue({ ...mockUser, ...userOverrides });
  client.users.updateMe = vi.fn().mockResolvedValue({ ...mockUser, name: 'TestUser', ...userOverrides });
  client.travels.create = vi.fn().mockResolvedValue(mockTravel);
  client.categories.create = vi.fn().mockResolvedValue(mockCategory);
  client.onboarding.complete = vi.fn().mockResolvedValue(undefined);
  return client;
}

let queryClient: QueryClient;

function renderWizard(
  onNavigate = vi.fn(),
  clientOverrides?: Partial<typeof mockUser>,
) {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const mockClient = createMockClient(clientOverrides);

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <OnboardingWizard onNavigate={onNavigate} />
        </QueryClientProvider>
      </ApiClientProvider>,
    ),
    mockClient,
    onNavigate,
  };
}

beforeEach(() => {
  welcomeProps = {};
  tripFormProps = {};
  categoriesProps = {};
  readyProps = {};
  progressBarProps = {};
});

afterEach(() => {
  cleanup();
});

describe('OnboardingWizard', () => {
  it('renders step 1 (welcome view) initially', async () => {
    const { getByTestId } = renderWizard();

    await waitFor(() => {
      expect(getByTestId('welcome-view')).toBeDefined();
    });

    expect(progressBarProps.currentStep).toBe(1);
    expect(progressBarProps.totalSteps).toBe(4);
  });

  it('shows name input when user has no name', async () => {
    renderWizard(vi.fn(), { name: '' });

    await waitFor(() => {
      expect(welcomeProps.showNameInput).toBe(true);
    });
  });

  it('hides name input when user already has a name', async () => {
    renderWizard(vi.fn(), { name: 'Existing User' });

    await waitFor(() => {
      expect(welcomeProps.showNameInput).toBe(false);
    });
  });

  it('advances from step 1 to step 2 when onNext is called without name', async () => {
    const { getByTestId } = renderWizard(vi.fn(), { name: 'Existing User' });

    await waitFor(() => {
      expect(welcomeProps.onNext).toBeDefined();
    });

    act(() => {
      (welcomeProps.onNext as (name?: string) => void)();
    });

    await waitFor(() => {
      expect(getByTestId('trip-form-view')).toBeDefined();
    });

    expect(progressBarProps.currentStep).toBe(2);
  });

  it('advances from step 1 to step 2 after saving name', async () => {
    const { mockClient, getByTestId } = renderWizard();

    await waitFor(() => {
      expect(welcomeProps.onNext).toBeDefined();
    });

    act(() => {
      (welcomeProps.onNext as (name?: string) => void)('TestUser');
    });

    await waitFor(() => {
      expect(mockClient.users.updateMe).toHaveBeenCalledWith({ name: 'TestUser' });
    });

    await waitFor(() => {
      expect(getByTestId('trip-form-view')).toBeDefined();
    });
  });

  it('step 2 calls createTravel and stores trip ID, advances to step 3', async () => {
    const { mockClient, getByTestId } = renderWizard(vi.fn(), { name: 'User' });

    // Advance to step 2
    await waitFor(() => {
      expect(welcomeProps.onNext).toBeDefined();
    });
    act(() => {
      (welcomeProps.onNext as (name?: string) => void)();
    });

    await waitFor(() => {
      expect(tripFormProps.onNext).toBeDefined();
    });

    const tripData = {
      name: 'Test Trip',
      description: 'A trip',
      currency: 'USD',
      budget: 1000,
      startDate: '2026-01-01',
      endDate: '2026-01-08',
    };

    act(() => {
      (tripFormProps.onNext as (data: typeof tripData) => void)(tripData);
    });

    await waitFor(() => {
      expect(mockClient.travels.create).toHaveBeenCalledWith(tripData);
    });

    await waitFor(() => {
      expect(getByTestId('categories-view')).toBeDefined();
    });

    expect(progressBarProps.currentStep).toBe(3);
  });

  it('step 4 calls completeOnboarding on action press', async () => {
    const onNavigate = vi.fn();
    const { mockClient, getByTestId } = renderWizard(onNavigate, { name: 'User' });

    // Navigate to step 2
    await waitFor(() => {
      expect(welcomeProps.onNext).toBeDefined();
    });
    act(() => {
      (welcomeProps.onNext as (name?: string) => void)();
    });

    // Navigate to step 3
    await waitFor(() => {
      expect(tripFormProps.onNext).toBeDefined();
    });
    act(() => {
      (tripFormProps.onNext as (data: Record<string, unknown>) => void)({
        name: 'Trip',
        description: '',
        currency: 'USD',
        budget: 1000,
        startDate: '2026-01-01',
        endDate: '2026-01-08',
      });
    });

    // Navigate to step 4
    await waitFor(() => {
      expect(categoriesProps.onNext).toBeDefined();
    });
    act(() => {
      (categoriesProps.onNext as () => void)();
    });

    await waitFor(() => {
      expect(getByTestId('ready-view')).toBeDefined();
    });

    // Click go to dashboard
    act(() => {
      (readyProps.onGoToDashboard as () => void)();
    });

    await waitFor(() => {
      expect(mockClient.onboarding.complete).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/travels/t1');
    });
  });

  it('skip at step 1 calls completeOnboarding and navigates to /travels', async () => {
    const onNavigate = vi.fn();
    const { mockClient } = renderWizard(onNavigate);

    await waitFor(() => {
      expect(welcomeProps.onSkip).toBeDefined();
    });

    act(() => {
      (welcomeProps.onSkip as () => void)();
    });

    await waitFor(() => {
      expect(mockClient.onboarding.complete).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/travels');
    });
  });

  it('skip at step 2 calls completeOnboarding and navigates to /travels', async () => {
    const onNavigate = vi.fn();
    const { mockClient } = renderWizard(onNavigate, { name: 'User' });

    // Advance to step 2
    await waitFor(() => {
      expect(welcomeProps.onNext).toBeDefined();
    });
    act(() => {
      (welcomeProps.onNext as (name?: string) => void)();
    });

    await waitFor(() => {
      expect(tripFormProps.onSkip).toBeDefined();
    });

    act(() => {
      (tripFormProps.onSkip as () => void)();
    });

    await waitFor(() => {
      expect(mockClient.onboarding.complete).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/travels');
    });
  });

  it('skip at step 3 calls completeOnboarding and navigates to /travels', async () => {
    const onNavigate = vi.fn();
    const { mockClient } = renderWizard(onNavigate, { name: 'User' });

    // Advance to step 2
    await waitFor(() => {
      expect(welcomeProps.onNext).toBeDefined();
    });
    act(() => {
      (welcomeProps.onNext as (name?: string) => void)();
    });

    // Advance to step 3
    await waitFor(() => {
      expect(tripFormProps.onNext).toBeDefined();
    });
    act(() => {
      (tripFormProps.onNext as (data: Record<string, unknown>) => void)({
        name: 'Trip',
        description: '',
        currency: 'USD',
        budget: 1000,
        startDate: '2026-01-01',
        endDate: '2026-01-08',
      });
    });

    await waitFor(() => {
      expect(categoriesProps.onSkip).toBeDefined();
    });

    act(() => {
      (categoriesProps.onSkip as () => void)();
    });

    await waitFor(() => {
      expect(mockClient.onboarding.complete).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('/travels');
    });
  });
});
