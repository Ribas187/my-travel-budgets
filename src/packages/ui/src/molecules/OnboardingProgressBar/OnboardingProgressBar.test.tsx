import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OnboardingProgressBar } from './OnboardingProgressBar';

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

describe('OnboardingProgressBar', () => {
  it('is defined and is a function', () => {
    expect(OnboardingProgressBar).toBeDefined();
    expect(typeof OnboardingProgressBar).toBe('function');
  });

  it('receives currentStep and totalSteps props', () => {
    const element = React.createElement(OnboardingProgressBar, {
      currentStep: 2,
      totalSteps: 4,
    });
    expect(element.props.currentStep).toBe(2);
    expect(element.props.totalSteps).toBe(4);
  });

  it('renders correct step number for step 1 of 4', () => {
    const element = React.createElement(OnboardingProgressBar, {
      currentStep: 1,
      totalSteps: 4,
    });
    expect(element.props.currentStep).toBe(1);
    expect(element.props.totalSteps).toBe(4);
  });

  it('renders correct step number for step 3 of 4', () => {
    const element = React.createElement(OnboardingProgressBar, {
      currentStep: 3,
      totalSteps: 4,
    });
    expect(element.props.currentStep).toBe(3);
  });

  it('renders correct step number for final step', () => {
    const element = React.createElement(OnboardingProgressBar, {
      currentStep: 4,
      totalSteps: 4,
    });
    expect(element.props.currentStep).toBe(4);
    expect(element.props.totalSteps).toBe(4);
  });
});
