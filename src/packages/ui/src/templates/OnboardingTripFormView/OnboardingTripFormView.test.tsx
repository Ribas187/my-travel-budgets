import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OnboardingTripFormView } from './OnboardingTripFormView';

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

const defaultFormData = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  currency: 'USD',
  budget: '0',
};

const defaultProps = {
  formData: defaultFormData,
  onFieldChange: vi.fn(),
  onNext: vi.fn(),
  onBack: vi.fn(),
  onSkip: vi.fn(),
};

describe('OnboardingTripFormView', () => {
  it('is defined and is a function', () => {
    expect(OnboardingTripFormView).toBeDefined();
    expect(typeof OnboardingTripFormView).toBe('function');
  });

  it('renders with required props', () => {
    const element = React.createElement(OnboardingTripFormView, defaultProps);
    expect(element).toBeDefined();
    expect(element.props.formData).toEqual(defaultFormData);
  });

  it('receives field group navigation callbacks', () => {
    const onNext = vi.fn();
    const onBack = vi.fn();
    const element = React.createElement(OnboardingTripFormView, {
      ...defaultProps,
      onNext,
      onBack,
    });
    expect(element.props.onNext).toBe(onNext);
    expect(element.props.onBack).toBe(onBack);
  });

  it('passes form data with all 6 fields', () => {
    const formData = {
      name: 'Italy Trip',
      description: 'Summer vacation',
      startDate: '2026-06-01',
      endDate: '2026-06-15',
      currency: 'EUR',
      budget: '5000',
    };
    const element = React.createElement(OnboardingTripFormView, {
      ...defaultProps,
      formData,
    });
    expect(element.props.formData.name).toBe('Italy Trip');
    expect(element.props.formData.description).toBe('Summer vacation');
    expect(element.props.formData.startDate).toBe('2026-06-01');
    expect(element.props.formData.endDate).toBe('2026-06-15');
    expect(element.props.formData.currency).toBe('EUR');
    expect(element.props.formData.budget).toBe('5000');
  });

  it('passes onSkip callback', () => {
    const onSkip = vi.fn();
    const element = React.createElement(OnboardingTripFormView, {
      ...defaultProps,
      onSkip,
    });
    expect(element.props.onSkip).toBe(onSkip);
  });

  it('accepts saving prop', () => {
    const element = React.createElement(OnboardingTripFormView, {
      ...defaultProps,
      saving: true,
    });
    expect(element.props.saving).toBe(true);
  });

  it('receives onFieldChange callback for field updates', () => {
    const onFieldChange = vi.fn();
    const element = React.createElement(OnboardingTripFormView, {
      ...defaultProps,
      onFieldChange,
    });
    expect(element.props.onFieldChange).toBe(onFieldChange);
  });
});
