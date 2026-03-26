// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider, useTravelContext } from './TravelContext';

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

describe('TravelContext', () => {
  it('throws when useTravelContext is used outside TravelProvider', () => {
    expect(() => {
      renderHook(() => useTravelContext());
    }).toThrow('useTravelContext must be used within a TravelProvider');
  });

  it('returns provided values inside TravelProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
        {children}
      </TravelProvider>
    );

    const { result } = renderHook(() => useTravelContext(), { wrapper });

    expect(result.current.travel).toBe(mockTravel);
    expect(result.current.isOwner).toBe(true);
    expect(result.current.currentUserId).toBe('u1');
  });

  it('does not throw when optional callbacks are undefined', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TravelProvider travel={mockTravel} isOwner={false} currentUserId={null}>
        {children}
      </TravelProvider>
    );

    const { result } = renderHook(() => useTravelContext(), { wrapper });

    expect(result.current.onOpenNavigationSheet).toBeUndefined();
    expect(result.current.onAddExpense).toBeUndefined();
  });

  it('passes optional callbacks when provided', () => {
    const onOpen = () => {};
    const onAdd = () => {};

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TravelProvider
        travel={mockTravel}
        isOwner={false}
        currentUserId={null}
        onOpenNavigationSheet={onOpen}
        onAddExpense={onAdd}
      >
        {children}
      </TravelProvider>
    );

    const { result } = renderHook(() => useTravelContext(), { wrapper });

    expect(result.current.onOpenNavigationSheet).toBe(onOpen);
    expect(result.current.onAddExpense).toBe(onAdd);
  });
});
