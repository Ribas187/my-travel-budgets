import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OnboardingReadyView } from './OnboardingReadyView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'onboarding.step' && params) {
        return `Step ${params.current} of ${params.total}`;
      }
      if (key === 'onboarding.ready.summary' && params) {
        return `You created **${params.tripName}** with **${params.count} categories**`;
      }
      return key;
    },
  }),
}));

const defaultProps = {
  tripName: 'Italy Trip',
  categoryCount: 6,
  onAddExpense: vi.fn(),
  onInviteMembers: vi.fn(),
  onGoToDashboard: vi.fn(),
  onSkip: vi.fn(),
};

describe('OnboardingReadyView', () => {
  it('is defined and is a function', () => {
    expect(OnboardingReadyView).toBeDefined();
    expect(typeof OnboardingReadyView).toBe('function');
  });

  it('renders with required props', () => {
    const element = React.createElement(OnboardingReadyView, defaultProps);
    expect(element).toBeDefined();
    expect(element.props.tripName).toBe('Italy Trip');
    expect(element.props.categoryCount).toBe(6);
  });

  it('passes summary data (tripName and categoryCount)', () => {
    const element = React.createElement(OnboardingReadyView, {
      ...defaultProps,
      tripName: 'Paris Vacation',
      categoryCount: 4,
    });
    expect(element.props.tripName).toBe('Paris Vacation');
    expect(element.props.categoryCount).toBe(4);
  });

  it('passes onAddExpense callback (action button 1)', () => {
    const onAddExpense = vi.fn();
    const element = React.createElement(OnboardingReadyView, {
      ...defaultProps,
      onAddExpense,
    });
    expect(element.props.onAddExpense).toBe(onAddExpense);
  });

  it('passes onInviteMembers callback (action button 2)', () => {
    const onInviteMembers = vi.fn();
    const element = React.createElement(OnboardingReadyView, {
      ...defaultProps,
      onInviteMembers,
    });
    expect(element.props.onInviteMembers).toBe(onInviteMembers);
  });

  it('passes onGoToDashboard callback (action button 3)', () => {
    const onGoToDashboard = vi.fn();
    const element = React.createElement(OnboardingReadyView, {
      ...defaultProps,
      onGoToDashboard,
    });
    expect(element.props.onGoToDashboard).toBe(onGoToDashboard);
  });

  it('has all 3 action button callbacks', () => {
    const element = React.createElement(OnboardingReadyView, defaultProps);
    expect(typeof element.props.onAddExpense).toBe('function');
    expect(typeof element.props.onInviteMembers).toBe('function');
    expect(typeof element.props.onGoToDashboard).toBe('function');
  });

  it('passes onSkip callback', () => {
    const onSkip = vi.fn();
    const element = React.createElement(OnboardingReadyView, {
      ...defaultProps,
      onSkip,
    });
    expect(element.props.onSkip).toBe(onSkip);
  });
});
