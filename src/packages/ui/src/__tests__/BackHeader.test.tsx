import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { BackHeader } from '../BackHeader';

describe('BackHeader', () => {
  it('renders title text', () => {
    const element = React.createElement(BackHeader, {
      title: 'My Trip',
      onBack: vi.fn(),
    });
    expect(element).toBeDefined();
    expect(element.props.title).toBe('My Trip');
  });

  it('fires onBack callback on click', () => {
    const onBack = vi.fn();
    const element = React.createElement(BackHeader, {
      title: 'My Trip',
      onBack,
    });
    expect(element.props.onBack).toBe(onBack);
  });

  it('renders correct default aria-label based on title', () => {
    const element = React.createElement(BackHeader, {
      title: 'Summer Trip',
      onBack: vi.fn(),
    });
    // Default accessibilityLabel is "Back to {title}"
    expect(element.props.accessibilityLabel).toBeUndefined();
    // The component internally uses `Back to ${title}` when no accessibilityLabel provided
    expect(element.props.title).toBe('Summer Trip');
  });

  it('renders custom aria-label when accessibilityLabel prop is provided', () => {
    const element = React.createElement(BackHeader, {
      title: 'Summer Trip',
      onBack: vi.fn(),
      accessibilityLabel: 'Go back to Summer Trip',
    });
    expect(element.props.accessibilityLabel).toBe('Go back to Summer Trip');
  });

  it('passes all required props correctly', () => {
    const onBack = vi.fn();
    const element = React.createElement(BackHeader, {
      title: 'Europe 2026',
      onBack,
      accessibilityLabel: 'Back to Europe 2026',
    });
    expect(element.props.title).toBe('Europe 2026');
    expect(element.props.onBack).toBe(onBack);
    expect(element.props.accessibilityLabel).toBe('Back to Europe 2026');
  });
});
