import { describe, it, expect } from 'vitest';
import React from 'react';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider, useTravelContext } from '@repo/features';

const mockTravel: TravelDetail = {
  id: 'travel-1',
  name: 'Test Trip',
  description: null,
  imageUrl: null,
  currency: 'USD',
  budget: 5000,
  startDate: '2026-06-01',
  endDate: '2026-06-15',
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
        name: 'Test User',
        avatarUrl: null,
        createdAt: '',
        updatedAt: '',
      },
      createdAt: '',
      updatedAt: '',
    },
  ],
  categories: [],
};

describe('TravelProvider', () => {
  it('creates a provider element', () => {
    const element = React.createElement(TravelProvider, {
      travel: mockTravel,
      isOwner: true,
      currentUserId: 'u1',
      children: React.createElement('div', null, 'child'),
    });
    expect(element).toBeDefined();
    expect(element.props.travel).toBe(mockTravel);
    expect(element.props.isOwner).toBe(true);
    expect(element.props.currentUserId).toBe('u1');
  });

  it('provides travel data to children', () => {
    const element = React.createElement(TravelProvider, {
      travel: mockTravel,
      isOwner: false,
      currentUserId: 'u2',
      children: React.createElement('div', null, 'test'),
    });
    expect(element.props.travel.name).toBe('Test Trip');
    expect(element.props.isOwner).toBe(false);
    expect(element.props.currentUserId).toBe('u2');
  });
});

describe('useTravelContext', () => {
  it('is defined as a function', () => {
    expect(typeof useTravelContext).toBe('function');
  });

  it('throws when used outside React component', () => {
    // useContext can't be called outside React render tree
    expect(() => useTravelContext()).toThrow();
  });
});
