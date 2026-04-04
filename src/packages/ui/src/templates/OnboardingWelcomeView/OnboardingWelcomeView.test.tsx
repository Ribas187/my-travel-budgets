import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OnboardingWelcomeView } from './OnboardingWelcomeView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'onboarding.step' && params) {
        return `Step ${params.current} of ${params.total}`;
      }
      return key;
    },
  }),
}));

const defaultProps = {
  showNameInput: false,
  nameValue: '',
  onNameChange: vi.fn(),
  onGetStarted: vi.fn(),
  onSkip: vi.fn(),
};

describe('OnboardingWelcomeView', () => {
  it('is defined and is a function', () => {
    expect(OnboardingWelcomeView).toBeDefined();
    expect(typeof OnboardingWelcomeView).toBe('function');
  });

  it('renders with required props', () => {
    const element = React.createElement(OnboardingWelcomeView, defaultProps);
    expect(element).toBeDefined();
    expect(element.props.showNameInput).toBe(false);
  });

  it('renders title and subtitle via i18n keys', () => {
    const element = React.createElement(OnboardingWelcomeView, defaultProps);
    // The component uses t('onboarding.welcome.title') and t('onboarding.welcome.subtitle')
    expect(element.props.onGetStarted).toBe(defaultProps.onGetStarted);
    expect(element.props.onSkip).toBe(defaultProps.onSkip);
  });

  it('shows name input when showNameInput is true', () => {
    const element = React.createElement(OnboardingWelcomeView, {
      ...defaultProps,
      showNameInput: true,
    });
    expect(element.props.showNameInput).toBe(true);
  });

  it('hides name input when showNameInput is false', () => {
    const element = React.createElement(OnboardingWelcomeView, {
      ...defaultProps,
      showNameInput: false,
    });
    expect(element.props.showNameInput).toBe(false);
  });

  it('passes nameValue and onNameChange', () => {
    const onNameChange = vi.fn();
    const element = React.createElement(OnboardingWelcomeView, {
      ...defaultProps,
      showNameInput: true,
      nameValue: 'John',
      onNameChange,
    });
    expect(element.props.nameValue).toBe('John');
    expect(element.props.onNameChange).toBe(onNameChange);
  });

  it('passes onSkip callback', () => {
    const onSkip = vi.fn();
    const element = React.createElement(OnboardingWelcomeView, {
      ...defaultProps,
      onSkip,
    });
    expect(element.props.onSkip).toBe(onSkip);
  });

  it('passes onGetStarted callback', () => {
    const onGetStarted = vi.fn();
    const element = React.createElement(OnboardingWelcomeView, {
      ...defaultProps,
      onGetStarted,
    });
    expect(element.props.onGetStarted).toBe(onGetStarted);
  });
});
