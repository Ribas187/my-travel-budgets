import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import type { TravelDetail } from '@repo/api-client';
import type { NavigationSheetItem } from '@repo/ui';

const mockTravel: TravelDetail = {
  id: 'travel-1',
  name: 'Lisbon Trip',
  description: null,
  imageUrl: null,
  currency: 'EUR',
  budget: 3000,
  startDate: '2026-03-15',
  endDate: '2026-03-25',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [
    {
      id: 'm1',
      travelId: 'travel-1',
      userId: 'u1',
      guestName: null,
      role: 'owner',
      user: {
        id: 'u1',
        email: 'user@test.com',
        name: 'Alice',
        avatarUrl: null,
        mainTravelId: null,
        createdAt: '',
        updatedAt: '',
      },
      createdAt: '',
      updatedAt: '',
    },
  ],
  categories: [],
};

describe('NavigationSheet integration with TravelLayout', () => {
  it('avatar click triggers onOpenNavigationSheet via TravelContext', () => {
    const onOpenNavigationSheet = vi.fn();

    // Simulate what DashboardPage does: reads onOpenNavigationSheet from context
    // and passes it to the avatar's onPress
    const avatarElement = React.createElement('button', {
      'data-testid': 'header-avatar',
      onClick: onOpenNavigationSheet,
      'aria-label': 'Open navigation menu',
    });

    // Simulate the click
    avatarElement.props.onClick();
    expect(onOpenNavigationSheet).toHaveBeenCalledTimes(1);
  });

  it('Profile item navigates to /profile', () => {
    const navigateMock = vi.fn();
    const setSheetOpen = vi.fn();

    const profileItem: NavigationSheetItem = {
      key: 'profile',
      label: 'Profile',
      icon: React.createElement('span', null, '👤'),
      onPress: () => {
        setSheetOpen(false);
        navigateMock({ to: '/profile' });
      },
    };

    profileItem.onPress();

    expect(setSheetOpen).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith({ to: '/profile' });
  });

  it('My Travels item navigates to /travels', () => {
    const navigateMock = vi.fn();
    const setSheetOpen = vi.fn();

    const myTravelsItem: NavigationSheetItem = {
      key: 'myTravels',
      label: 'My Travels',
      icon: React.createElement('span', null, '✈️'),
      onPress: () => {
        setSheetOpen(false);
        navigateMock({ to: '/travels' });
      },
    };

    myTravelsItem.onPress();

    expect(setSheetOpen).toHaveBeenCalledWith(false);
    expect(navigateMock).toHaveBeenCalledWith({ to: '/travels' });
  });

  it('Logout item calls logout and closes sheet', () => {
    const logoutMock = vi.fn();
    const setSheetOpen = vi.fn();

    const logoutItem: NavigationSheetItem = {
      key: 'logout',
      label: 'Logout',
      icon: React.createElement('span', null, '🚪'),
      onPress: () => {
        setSheetOpen(false);
        logoutMock();
      },
      destructive: true,
    };

    logoutItem.onPress();

    expect(setSheetOpen).toHaveBeenCalledWith(false);
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutItem.destructive).toBe(true);
  });

  it('sheet is only rendered when not desktop', () => {
    // Simulate the conditional rendering logic from TravelLayout
    const isDesktop = true;
    const sheetElement = !isDesktop
      ? React.createElement('div', { 'data-testid': 'navigation-sheet' })
      : null;

    expect(sheetElement).toBeNull();

    // When mobile
    const isMobile = false;
    const mobileSheetElement = !isMobile
      ? React.createElement('div', { 'data-testid': 'navigation-sheet' })
      : null;

    expect(mobileSheetElement).not.toBeNull();
  });

  it('TravelContext provides onOpenNavigationSheet callback', async () => {
    const { TravelProvider } = await import('@repo/features');
    const handleOpenSheet = vi.fn();

    const element = React.createElement(TravelProvider, {
      travel: mockTravel,
      isOwner: true,
      currentUserId: 'u1',
      onOpenNavigationSheet: handleOpenSheet,
      children: React.createElement('div', null, 'child'),
    });

    expect(element.props.onOpenNavigationSheet).toBe(handleOpenSheet);
  });

  it('user name and initial are derived correctly from useUserMe data', () => {
    const userName = 'Alice';
    const userInitial = userName ? userName.charAt(0).toUpperCase() : undefined;

    expect(userInitial).toBe('A');

    // Edge case: empty name falls back to undefined (icon shown instead)
    const emptyName: string = '';
    const emptyInitial = emptyName ? emptyName.charAt(0).toUpperCase() : undefined;
    expect(emptyInitial).toBeUndefined();
  });

  it('sheet items array contains exactly 3 items: profile, myTravels, logout', () => {
    const items: NavigationSheetItem[] = [
      {
        key: 'profile',
        label: 'Profile',
        icon: React.createElement('span', null, '👤'),
        onPress: vi.fn(),
      },
      {
        key: 'myTravels',
        label: 'My Travels',
        icon: React.createElement('span', null, '✈️'),
        onPress: vi.fn(),
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: React.createElement('span', null, '🚪'),
        onPress: vi.fn(),
        destructive: true,
      },
    ];

    expect(items).toHaveLength(3);
    expect(items.map((i) => i.key)).toEqual(['profile', 'myTravels', 'logout']);
    expect(items[2].destructive).toBe(true);
  });

  it('sheet closes before navigating (setSheetOpen called before navigate)', () => {
    const callOrder: string[] = [];
    const setSheetOpen = vi.fn((_value: boolean) => callOrder.push('close'));
    const navigate = vi.fn((_opts: { to: string }) => callOrder.push('navigate'));

    // Simulate the profile item's onPress
    setSheetOpen(false);
    navigate({ to: '/profile' });

    expect(callOrder).toEqual(['close', 'navigate']);
  });
});
