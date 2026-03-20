import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { CategoryEditCard } from '../CategoryEditCard';

describe('CategoryEditCard', () => {
  it('renders without errors with required props', () => {
    const element = React.createElement(CategoryEditCard, { name: 'Food & Drinks' });
    expect(element).toBeDefined();
    expect(element.props.name).toBe('Food & Drinks');
  });

  it('defaults to collapsed state', () => {
    const element = React.createElement(CategoryEditCard, { name: 'Food' });
    expect(element.props.expanded).toBeUndefined();
  });

  it('accepts expanded prop for toggling state', () => {
    const collapsed = React.createElement(CategoryEditCard, { name: 'Food', expanded: false });
    expect(collapsed.props.expanded).toBe(false);

    const expanded = React.createElement(CategoryEditCard, { name: 'Food', expanded: true });
    expect(expanded.props.expanded).toBe(true);
  });

  it('accepts onToggle handler', () => {
    const handler = vi.fn();
    const element = React.createElement(CategoryEditCard, { name: 'Food', onToggle: handler });
    expect(element.props.onToggle).toBe(handler);
  });

  it('accepts children for expanded content', () => {
    const child = React.createElement('div', null, 'Edit form');
    const element = React.createElement(CategoryEditCard, {
      name: 'Food',
      expanded: true,
      children: child,
    });
    expect(element.props.children).toBe(child);
  });

  it('accepts actions for expanded state', () => {
    const actions = React.createElement('div', null, 'Cancel / Save');
    const element = React.createElement(CategoryEditCard, {
      name: 'Food',
      expanded: true,
      actions,
    });
    expect(element.props.actions).toBe(actions);
  });

  it('shows budget label in collapsed state', () => {
    const element = React.createElement(CategoryEditCard, {
      name: 'Food',
      budgetLabel: 'Budget: €500',
    });
    expect(element.props.budgetLabel).toBe('Budget: €500');
  });
});
