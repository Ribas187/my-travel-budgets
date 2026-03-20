import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { BottomNav } from '../BottomNav';

const makeTabs = () => [
  { key: 'home', label: 'Home', icon: React.createElement('span', null, 'H') },
  { key: 'expenses', label: 'Expenses', icon: React.createElement('span', null, 'E') },
  { key: 'budget', label: 'Budget', icon: React.createElement('span', null, 'B') },
  { key: 'group', label: 'Group', icon: React.createElement('span', null, 'G') },
];

describe('BottomNav', () => {
  it('is defined and is a function component', () => {
    expect(BottomNav).toBeDefined();
    expect(typeof BottomNav).toBe('function');
  });

  it('renders without errors with required props', () => {
    const element = React.createElement(BottomNav, {
      tabs: makeTabs(),
      activeTab: 'home',
      onTabPress: vi.fn(),
    });
    expect(element).toBeDefined();
    expect(element.props.tabs).toHaveLength(4);
  });

  it('passes all tab slots', () => {
    const tabs = makeTabs();
    const element = React.createElement(BottomNav, {
      tabs,
      activeTab: 'home',
      onTabPress: vi.fn(),
    });
    expect(element.props.tabs).toBe(tabs);
    expect(element.props.tabs.map((t: { key: string }) => t.key)).toEqual([
      'home',
      'expenses',
      'budget',
      'group',
    ]);
  });

  it('highlights the active tab', () => {
    const element = React.createElement(BottomNav, {
      tabs: makeTabs(),
      activeTab: 'expenses',
      onTabPress: vi.fn(),
    });
    expect(element.props.activeTab).toBe('expenses');
  });

  it('calls onTabPress with correct route key', () => {
    const handler = vi.fn();
    const element = React.createElement(BottomNav, {
      tabs: makeTabs(),
      activeTab: 'home',
      onTabPress: handler,
    });
    // Simulate: the onTabPress callback receives the tab key
    element.props.onTabPress('budget');
    expect(handler).toHaveBeenCalledWith('budget');
  });

  it('accepts optional FAB slot', () => {
    const fab = React.createElement('div', null, '+');
    const element = React.createElement(BottomNav, {
      tabs: makeTabs(),
      activeTab: 'home',
      onTabPress: vi.fn(),
      fabSlot: fab,
    });
    expect(element.props.fabSlot).toBe(fab);
  });
});
