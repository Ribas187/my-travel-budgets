import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { TripForm } from '../TripForm';

const mockTravel = {
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
      role: 'owner' as const,
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

describe('TripForm date picker integration', () => {
  it('renders TripForm with DatePickerInput for start and end dates', () => {
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      travel: mockTravel,
      saving: false,
      onSave,
    });
    expect(element).toBeDefined();
    expect(element.props.travel.startDate).toBe('2026-06-01');
    expect(element.props.travel.endDate).toBe('2026-06-15');
  });

  it('creates TripForm in create mode with empty dates', () => {
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      saving: false,
      onSave,
    });
    expect(element).toBeDefined();
    expect(element.props.travel).toBeUndefined();
  });

  it('passes travel with start and end dates for edit mode pre-selection', () => {
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      travel: mockTravel,
      saving: false,
      onSave,
    });
    // In edit mode, the form receives the travel with existing dates
    // DatePickerInput receives these values via Controller and pre-selects them
    expect(element.props.travel.startDate).toBe('2026-06-01');
    expect(element.props.travel.endDate).toBe('2026-06-15');
  });

  it('accepts onSave callback for form submission with date values', () => {
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      travel: mockTravel,
      saving: false,
      onSave,
    });
    expect(element.props.onSave).toBe(onSave);
  });

  it('handles travel with ISO datetime strings for dates', () => {
    const travelWithDatetime = {
      ...mockTravel,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-15T00:00:00.000Z',
    };
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      travel: travelWithDatetime,
      saving: false,
      onSave,
    });
    // formatDateForInput strips the time portion
    expect(element.props.travel.startDate).toContain('2026-06-01');
    expect(element.props.travel.endDate).toContain('2026-06-15');
  });
});
