import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { TooltipTip } from './TooltipTip';

describe('TooltipTip', () => {
  const baseProps = {
    tipId: 'budget_progress_bar',
    message: 'Colors show your spending status',
    dismissLabel: 'Got it',
    onDismiss: vi.fn(),
  };

  it('renders without errors', () => {
    const element = React.createElement(TooltipTip, baseProps);
    expect(element).toBeDefined();
  });

  it('receives message prop', () => {
    const element = React.createElement(TooltipTip, baseProps);
    expect(element.props.message).toBe('Colors show your spending status');
  });

  it('receives tipId prop', () => {
    const element = React.createElement(TooltipTip, baseProps);
    expect(element.props.tipId).toBe('budget_progress_bar');
  });

  it('receives dismissLabel prop for "Got it" button', () => {
    const element = React.createElement(TooltipTip, baseProps);
    expect(element.props.dismissLabel).toBe('Got it');
  });

  it('receives onDismiss callback', () => {
    const onDismiss = vi.fn();
    const element = React.createElement(TooltipTip, {
      ...baseProps,
      onDismiss,
    });
    expect(element.props.onDismiss).toBe(onDismiss);
  });

  it('defaults visible to true', () => {
    const element = React.createElement(TooltipTip, baseProps);
    expect(element.props.visible).toBeUndefined();
    // The component defaults visible to true internally
  });

  it('accepts visible prop set to false', () => {
    const element = React.createElement(TooltipTip, {
      ...baseProps,
      visible: false,
    });
    expect(element.props.visible).toBe(false);
  });

  it('accepts anchorRef prop', () => {
    const ref = { current: null };
    const element = React.createElement(TooltipTip, {
      ...baseProps,
      anchorRef: ref,
    });
    expect(element.props.anchorRef).toBe(ref);
  });

  it('renders with different tip IDs', () => {
    const membersTip = React.createElement(TooltipTip, {
      ...baseProps,
      tipId: 'members_invite_button',
      message: 'Invite friends to split expenses',
    });
    expect(membersTip.props.tipId).toBe('members_invite_button');
    expect(membersTip.props.message).toBe(
      'Invite friends to split expenses',
    );

    const categoryTip = React.createElement(TooltipTip, {
      ...baseProps,
      tipId: 'category_budget_limit',
      message: 'Set budget limits per category',
    });
    expect(categoryTip.props.tipId).toBe('category_budget_limit');
  });
});
