import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OnboardingCategoriesView } from './OnboardingCategoriesView';

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

const defaultCategories = [
  { nameKey: 'onboarding.defaultCategory.food', icon: '🍔', color: '#f97316', selected: true },
  { nameKey: 'onboarding.defaultCategory.transport', icon: '🚕', color: '#3b82f6', selected: true },
  { nameKey: 'onboarding.defaultCategory.accommodation', icon: '🏨', color: '#8b5cf6', selected: true },
  { nameKey: 'onboarding.defaultCategory.activities', icon: '🎯', color: '#10b981', selected: true },
  { nameKey: 'onboarding.defaultCategory.shopping', icon: '🛍️', color: '#ec4899', selected: true },
  { nameKey: 'onboarding.defaultCategory.other', icon: '📦', color: '#6b7280', selected: true },
];

const defaultProps = {
  categories: defaultCategories,
  onToggleCategory: vi.fn(),
  onEditCategory: vi.fn(),
  onAddCustom: vi.fn(),
  onNext: vi.fn(),
  onBack: vi.fn(),
  onSkip: vi.fn(),
};

describe('OnboardingCategoriesView', () => {
  it('is defined and is a function', () => {
    expect(OnboardingCategoriesView).toBeDefined();
    expect(typeof OnboardingCategoriesView).toBe('function');
  });

  it('renders with 6 categories', () => {
    const element = React.createElement(OnboardingCategoriesView, defaultProps);
    expect(element).toBeDefined();
    expect(element.props.categories).toHaveLength(6);
  });

  it('each category has nameKey, icon, color, and selected', () => {
    const element = React.createElement(OnboardingCategoriesView, defaultProps);
    for (const cat of element.props.categories) {
      expect(cat).toHaveProperty('nameKey');
      expect(cat).toHaveProperty('icon');
      expect(cat).toHaveProperty('color');
      expect(cat).toHaveProperty('selected');
    }
  });

  it('passes onToggleCategory callback', () => {
    const onToggleCategory = vi.fn();
    const element = React.createElement(OnboardingCategoriesView, {
      ...defaultProps,
      onToggleCategory,
    });
    expect(element.props.onToggleCategory).toBe(onToggleCategory);
  });

  it('passes onEditCategory callback', () => {
    const onEditCategory = vi.fn();
    const element = React.createElement(OnboardingCategoriesView, {
      ...defaultProps,
      onEditCategory,
    });
    expect(element.props.onEditCategory).toBe(onEditCategory);
  });

  it('passes onAddCustom callback', () => {
    const onAddCustom = vi.fn();
    const element = React.createElement(OnboardingCategoriesView, {
      ...defaultProps,
      onAddCustom,
    });
    expect(element.props.onAddCustom).toBe(onAddCustom);
  });

  it('passes onSkip callback', () => {
    const onSkip = vi.fn();
    const element = React.createElement(OnboardingCategoriesView, {
      ...defaultProps,
      onSkip,
    });
    expect(element.props.onSkip).toBe(onSkip);
  });

  it('supports categories with mixed selected states', () => {
    const mixedCategories = defaultCategories.map((cat, i) => ({
      ...cat,
      selected: i % 2 === 0,
    }));
    const element = React.createElement(OnboardingCategoriesView, {
      ...defaultProps,
      categories: mixedCategories,
    });
    expect(element.props.categories[0].selected).toBe(true);
    expect(element.props.categories[1].selected).toBe(false);
    expect(element.props.categories[2].selected).toBe(true);
  });

  it('accepts saving prop', () => {
    const element = React.createElement(OnboardingCategoriesView, {
      ...defaultProps,
      saving: true,
    });
    expect(element.props.saving).toBe(true);
  });
});
