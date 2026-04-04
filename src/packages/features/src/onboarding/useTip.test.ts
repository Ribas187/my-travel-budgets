// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import type { OnboardingTipId } from '@repo/core';

const mockMutate = vi.fn();

const mockUseUserMe = vi.fn();
const mockUseDismissTip = vi.fn(() => ({ mutate: mockMutate }));

vi.mock('@repo/api-client', () => ({
  useUserMe: (...args: unknown[]) => mockUseUserMe(...args),
  useDismissTip: (...args: unknown[]) => mockUseDismissTip(...args),
}));

// Import after mocks are set up
import { useTip } from './useTip';

const TIP_ID: OnboardingTipId = 'dashboard_first_visit';

describe('useTip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDismissTip.mockReturnValue({ mutate: mockMutate });
  });

  it('shouldShow is true for a tip not in dismissedTips when onboarding is complete', () => {
    mockUseUserMe.mockReturnValue({
      data: {
        id: 'u1',
        onboardingCompletedAt: '2026-01-01T00:00:00Z',
        dismissedTips: [],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useTip(TIP_ID));

    expect(result.current.shouldShow).toBe(true);
  });

  it('shouldShow is false for a tip already in dismissedTips', () => {
    mockUseUserMe.mockReturnValue({
      data: {
        id: 'u1',
        onboardingCompletedAt: '2026-01-01T00:00:00Z',
        dismissedTips: ['dashboard_first_visit'],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useTip(TIP_ID));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when onboardingCompletedAt is null', () => {
    mockUseUserMe.mockReturnValue({
      data: {
        id: 'u1',
        onboardingCompletedAt: null,
        dismissedTips: [],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useTip(TIP_ID));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false while user data is loading', () => {
    mockUseUserMe.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useTip(TIP_ID));

    expect(result.current.shouldShow).toBe(false);
  });

  it('shouldShow is false when user is not authenticated (no data)', () => {
    mockUseUserMe.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useTip(TIP_ID));

    expect(result.current.shouldShow).toBe(false);
  });

  it('dismiss() calls the dismiss mutation with the tip ID', () => {
    mockUseUserMe.mockReturnValue({
      data: {
        id: 'u1',
        onboardingCompletedAt: '2026-01-01T00:00:00Z',
        dismissedTips: [],
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useTip(TIP_ID));

    act(() => {
      result.current.dismiss();
    });

    expect(mockMutate).toHaveBeenCalledWith(TIP_ID);
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('shouldShow is true for one tip but false for another that is dismissed', () => {
    mockUseUserMe.mockReturnValue({
      data: {
        id: 'u1',
        onboardingCompletedAt: '2026-01-01T00:00:00Z',
        dismissedTips: ['summary_first_visit'],
      },
      isLoading: false,
    });

    const { result: resultShown } = renderHook(() => useTip('dashboard_first_visit'));
    const { result: resultHidden } = renderHook(() => useTip('summary_first_visit'));

    expect(resultShown.current.shouldShow).toBe(true);
    expect(resultHidden.current.shouldShow).toBe(false);
  });
});
