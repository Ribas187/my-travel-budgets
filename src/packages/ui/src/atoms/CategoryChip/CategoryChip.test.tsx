import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { CategoryChip } from './CategoryChip';

describe('CategoryChip', () => {
  it('renders without errors with required props', () => {
    const element = React.createElement(CategoryChip, { label: 'Food & Drinks' });
    expect(element).toBeDefined();
    expect(element.props.label).toBe('Food & Drinks');
  });

  it('defaults to unselected state', () => {
    const element = React.createElement(CategoryChip, { label: 'Food' });
    expect(element.props.selected).toBeUndefined();
  });

  it('accepts selected prop for toggling visual state', () => {
    const unselected = React.createElement(CategoryChip, { label: 'Food', selected: false });
    expect(unselected.props.selected).toBe(false);

    const selected = React.createElement(CategoryChip, { label: 'Food', selected: true });
    expect(selected.props.selected).toBe(true);
  });

  it('accepts custom selected colors', () => {
    const element = React.createElement(CategoryChip, {
      label: 'Food',
      selected: true,
      selectedBackgroundColor: '#FEF3C7',
      selectedBorderColor: '#F59E0B',
      selectedTextColor: '#92400E',
    });
    expect(element.props.selectedBackgroundColor).toBe('#FEF3C7');
    expect(element.props.selectedBorderColor).toBe('#F59E0B');
  });

  it('accepts onPress handler', () => {
    const handler = vi.fn();
    const element = React.createElement(CategoryChip, { label: 'Food', onPress: handler });
    expect(element.props.onPress).toBe(handler);
  });
});
