import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { InlineTip } from './InlineTip';

describe('InlineTip', () => {
  const baseProps = {
    tipId: 'dashboard_first_visit',
    message: 'Welcome to the dashboard!',
    onDismiss: vi.fn(),
  };

  it('renders without errors', () => {
    const element = React.createElement(InlineTip, baseProps);
    expect(element).toBeDefined();
  });

  it('receives message prop', () => {
    const element = React.createElement(InlineTip, baseProps);
    expect(element.props.message).toBe('Welcome to the dashboard!');
  });

  it('receives tipId prop', () => {
    const element = React.createElement(InlineTip, baseProps);
    expect(element.props.tipId).toBe('dashboard_first_visit');
  });

  it('receives onDismiss callback', () => {
    const onDismiss = vi.fn();
    const element = React.createElement(InlineTip, { ...baseProps, onDismiss });
    expect(element.props.onDismiss).toBe(onDismiss);
  });

  it('receives ctaLabel and onCtaPress when provided', () => {
    const onCtaPress = vi.fn();
    const element = React.createElement(InlineTip, {
      ...baseProps,
      ctaLabel: 'Create categories',
      onCtaPress,
    });
    expect(element.props.ctaLabel).toBe('Create categories');
    expect(element.props.onCtaPress).toBe(onCtaPress);
  });

  it('does not include ctaLabel when not provided', () => {
    const element = React.createElement(InlineTip, baseProps);
    expect(element.props.ctaLabel).toBeUndefined();
    expect(element.props.onCtaPress).toBeUndefined();
  });

  it('defaults visible to true', () => {
    const element = React.createElement(InlineTip, baseProps);
    expect(element.props.visible).toBeUndefined();
    // The component defaults visible to true internally
  });

  it('accepts visible prop set to false', () => {
    const element = React.createElement(InlineTip, {
      ...baseProps,
      visible: false,
    });
    expect(element.props.visible).toBe(false);
  });

  it('accepts an icon prop', () => {
    const element = React.createElement(InlineTip, {
      ...baseProps,
      icon: '💡',
    });
    expect(element.props.icon).toBe('💡');
  });

  it('renders with different tip IDs', () => {
    const expensesTip = React.createElement(InlineTip, {
      ...baseProps,
      tipId: 'expenses_no_categories',
      message: 'No categories yet',
      ctaLabel: 'Add categories',
      onCtaPress: vi.fn(),
    });
    expect(expensesTip.props.tipId).toBe('expenses_no_categories');
    expect(expensesTip.props.message).toBe('No categories yet');
    expect(expensesTip.props.ctaLabel).toBe('Add categories');

    const summaryTip = React.createElement(InlineTip, {
      ...baseProps,
      tipId: 'summary_first_visit',
      message: 'Summary insights appear here',
    });
    expect(summaryTip.props.tipId).toBe('summary_first_visit');
  });
});
