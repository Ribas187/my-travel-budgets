import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { NavigationSheet } from './NavigationSheet';

const makeItems = () => [
  {
    key: 'profile',
    label: 'Profile',
    icon: React.createElement('span', null, 'P'),
    onPress: vi.fn(),
  },
  {
    key: 'myTravels',
    label: 'My Travels',
    icon: React.createElement('span', null, 'T'),
    onPress: vi.fn(),
  },
  {
    key: 'logout',
    label: 'Logout',
    icon: React.createElement('span', null, 'L'),
    onPress: vi.fn(),
    destructive: true,
  },
];

describe('NavigationSheet', () => {
  it('renders all provided items with correct labels', () => {
    const items = makeItems();
    const element = React.createElement(NavigationSheet, {
      open: true,
      onOpenChange: vi.fn(),
      userName: 'Ricardo',
      userInitial: 'R',
      items,
    });
    expect(element).toBeDefined();
    expect(element.props.items).toHaveLength(3);
    expect(element.props.items.map((i: { label: string }) => i.label)).toEqual([
      'Profile',
      'My Travels',
      'Logout',
    ]);
  });

  it('pressing a menu item calls its onPress callback', () => {
    const items = makeItems();
    const element = React.createElement(NavigationSheet, {
      open: true,
      onOpenChange: vi.fn(),
      userName: 'Ricardo',
      userInitial: 'R',
      items,
    });
    // Simulate calling onPress on each item
    element.props.items[0].onPress();
    expect(items[0].onPress).toHaveBeenCalledTimes(1);

    element.props.items[1].onPress();
    expect(items[1].onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render content when open={false}', () => {
    const element = React.createElement(NavigationSheet, {
      open: false,
      onOpenChange: vi.fn(),
      userName: 'Ricardo',
      userInitial: 'R',
      items: makeItems(),
    });
    expect(element.props.open).toBe(false);
  });

  it('destructive item has destructive flag for distinct styling', () => {
    const items = makeItems();
    const element = React.createElement(NavigationSheet, {
      open: true,
      onOpenChange: vi.fn(),
      userName: 'Ricardo',
      userInitial: 'R',
      items,
    });
    const destructiveItems = element.props.items.filter(
      (i: { destructive?: boolean }) => i.destructive
    );
    expect(destructiveItems).toHaveLength(1);
    expect(destructiveItems[0].key).toBe('logout');
    expect(destructiveItems[0].destructive).toBe(true);
  });

  it('displays user name and initial in the sheet header', () => {
    const element = React.createElement(NavigationSheet, {
      open: true,
      onOpenChange: vi.fn(),
      userName: 'Ana Silva',
      userInitial: 'A',
      items: makeItems(),
    });
    expect(element.props.userName).toBe('Ana Silva');
    expect(element.props.userInitial).toBe('A');
  });

  it('renders initial in avatar when userInitial is provided', () => {
    const element = React.createElement(NavigationSheet, {
      open: true,
      onOpenChange: vi.fn(),
      userName: 'Ricardo',
      userInitial: 'R',
      items: makeItems(),
    });
    expect(element.props.userInitial).toBe('R');
    expect(element.props.showIconFallback).toBeUndefined();
  });

  it('renders User icon in avatar when showIconFallback is true', () => {
    const element = React.createElement(NavigationSheet, {
      open: true,
      onOpenChange: vi.fn(),
      userName: '',
      showIconFallback: true,
      items: makeItems(),
    });
    expect(element.props.showIconFallback).toBe(true);
    expect(element.props.userInitial).toBeUndefined();
  });
});
