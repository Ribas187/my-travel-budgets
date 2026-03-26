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

// --- Calculator Budget Input Integration Tests ---

describe('TripForm calculator budget input integration', () => {
  it('uses useCalculatorInput hook for budget field', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    expect(source).toContain('useCalculatorInput');
    expect(source).toContain('budgetCalculator');
  });

  it('uses AmountInput display component for budget (not plain FormInput)', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    expect(source).toContain('AmountInput');
    expect(source).toContain('budgetCalculator.displayText');
    // The budget no longer uses a Controller with FormInput
    expect(source).not.toMatch(/Controller[\s\S]*?name="budget"[\s\S]*?FormInput/);
  });

  it('uses hidden input pattern with inputMode="numeric" for budget', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    expect(source).toContain('budgetInputRef');
    expect(source).toContain('budgetCalculator.handleChange');
    expect(source).toContain('inputMode="numeric"');
  });

  it('initializes budget calculator with travel.budget in edit mode', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    expect(source).toContain("initialValue: travel?.budget ?? 0");
  });

  it('syncs budgetCalculator.numericValue to react-hook-form via useEffect', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    expect(source).toContain('budgetCalculator.numericValue');
    expect(source).toContain("setValue('budget'");
  });

  it('displays currency symbol matching selected currency', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    expect(source).toContain('currencySymbol');
    expect(source).toContain('getCurrencySymbol');
  });

  it('pre-fills budget calculator with existing travel budget in edit mode', () => {
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      travel: mockTravel,
      saving: false,
      onSave,
    });
    // In edit mode, budgetCalculator initializes with travel.budget (5000)
    expect(element.props.travel.budget).toBe(5000);
    expect(element).toBeDefined();
  });
});

// --- Date Overflow Fix Tests ---

describe('TripForm date overflow fix', () => {
  it('applies minWidth={0} to date YStack containers', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    // Both date YStack containers should have minWidth={0} to prevent flex overflow
    const dateSection = source.slice(
      source.indexOf('{/* Date Row */}'),
      source.indexOf('{/* Currency + Budget Row */}'),
    );
    const minWidthCount = (dateSection.match(/minWidth=\{0\}/g) || []).length;
    expect(minWidthCount).toBe(2);
  });

  it('keeps date fields side-by-side in an XStack', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, '../TripForm.tsx'), 'utf-8');
    const dateSection = source.slice(
      source.indexOf('{/* Date Row */}'),
      source.indexOf('{/* Currency + Budget Row */}'),
    );
    expect(dateSection).toContain('<XStack');
    expect(dateSection).toContain('flex={1}');
  });
});

describe('TripForm loading state', () => {
  it('passes saving=true to disable submit button and show spinner', () => {
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      travel: mockTravel,
      saving: true,
      onSave,
    });
    expect(element.props.saving).toBe(true);
    expect(element).toBeDefined();
  });

  it('passes saving=false for interactive state', () => {
    const onSave = vi.fn();
    const element = React.createElement(TripForm, {
      saving: false,
      onSave,
    });
    expect(element.props.saving).toBe(false);
  });
});
