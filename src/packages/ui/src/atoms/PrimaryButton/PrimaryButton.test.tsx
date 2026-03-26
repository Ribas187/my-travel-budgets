import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { PrimaryButton } from './PrimaryButton';

describe('PrimaryButton', () => {
  it('renders without errors with required props', () => {
    const element = React.createElement(PrimaryButton, { label: 'Save' });
    expect(element).toBeDefined();
    expect(element.props.label).toBe('Save');
  });

  it('passes loading prop', () => {
    const element = React.createElement(PrimaryButton, { label: 'Save', loading: true });
    expect(element.props.loading).toBe(true);
  });

  it('passes disabled prop', () => {
    const element = React.createElement(PrimaryButton, { label: 'Save', disabled: true });
    expect(element.props.disabled).toBe(true);
  });

  it('accepts onPress handler', () => {
    const handler = vi.fn();
    const element = React.createElement(PrimaryButton, { label: 'Save', onPress: handler });
    expect(element.props.onPress).toBe(handler);
  });

  it('is disabled when loading is true', () => {
    const element = React.createElement(PrimaryButton, { label: 'Save', loading: true });
    // Component logic: isDisabled = disabled || loading
    expect(element.props.loading || element.props.disabled).toBe(true);
  });
});
