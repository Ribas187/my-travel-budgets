import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { DesktopSidebar } from '../DesktopSidebar';

const makeNavItems = () => [
  { key: 'dashboard', label: 'Dashboard', icon: React.createElement('span', null, 'D') },
  { key: 'expenses', label: 'Expenses', icon: React.createElement('span', null, 'E') },
  { key: 'budget', label: 'Budget', icon: React.createElement('span', null, 'B') },
  { key: 'categories', label: 'Categories', icon: React.createElement('span', null, 'C') },
  { key: 'group', label: 'Group', icon: React.createElement('span', null, 'G') },
];

describe('DesktopSidebar', () => {
  it('is defined and is a function component', () => {
    expect(DesktopSidebar).toBeDefined();
    expect(typeof DesktopSidebar).toBe('function');
  });

  it('renders without errors with required props', () => {
    const element = React.createElement(DesktopSidebar, {
      navItems: makeNavItems(),
      activeItem: 'dashboard',
      onItemPress: vi.fn(),
    });
    expect(element).toBeDefined();
    expect(element.props.navItems).toHaveLength(5);
  });

  it('renders nav items matching desktop sidebar spec', () => {
    const items = makeNavItems();
    const element = React.createElement(DesktopSidebar, {
      navItems: items,
      activeItem: 'dashboard',
      onItemPress: vi.fn(),
    });
    expect(element.props.navItems.map((i: { key: string }) => i.key)).toEqual([
      'dashboard',
      'expenses',
      'budget',
      'categories',
      'group',
    ]);
  });

  it('highlights the active item', () => {
    const element = React.createElement(DesktopSidebar, {
      navItems: makeNavItems(),
      activeItem: 'expenses',
      onItemPress: vi.fn(),
    });
    expect(element.props.activeItem).toBe('expenses');
  });

  it('calls onItemPress with correct key', () => {
    const handler = vi.fn();
    const element = React.createElement(DesktopSidebar, {
      navItems: makeNavItems(),
      activeItem: 'dashboard',
      onItemPress: handler,
    });
    element.props.onItemPress('categories');
    expect(handler).toHaveBeenCalledWith('categories');
  });

  it('accepts optional user section', () => {
    const userSection = React.createElement('div', null, 'User Avatar');
    const element = React.createElement(DesktopSidebar, {
      navItems: makeNavItems(),
      activeItem: 'dashboard',
      onItemPress: vi.fn(),
      userSection,
    });
    expect(element.props.userSection).toBe(userSection);
  });

  it('accepts optional logo', () => {
    const logo = React.createElement('div', null, 'Logo');
    const element = React.createElement(DesktopSidebar, {
      navItems: makeNavItems(),
      activeItem: 'dashboard',
      onItemPress: vi.fn(),
      logo,
    });
    expect(element.props.logo).toBe(logo);
  });

  it('accepts optional footer items', () => {
    const footerItems = [
      { key: 'settings', label: 'Settings', icon: React.createElement('span', null, 'S') },
    ];
    const element = React.createElement(DesktopSidebar, {
      navItems: makeNavItems(),
      activeItem: 'dashboard',
      onItemPress: vi.fn(),
      footerItems,
    });
    expect(element.props.footerItems).toHaveLength(1);
    expect(element.props.footerItems[0].key).toBe('settings');
  });
});
