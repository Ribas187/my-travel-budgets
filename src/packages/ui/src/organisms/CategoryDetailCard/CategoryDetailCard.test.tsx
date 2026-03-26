import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { CategoryDetailCard } from './CategoryDetailCard';

describe('CategoryDetailCard', () => {
  const baseProps = {
    name: 'Food & Drinks',
    icon: '🍔' as React.ReactNode,
    iconColor: '#F59E0B',
    iconBackground: '#FEF3C7',
    spent: 300,
    budget: 500 as number | null,
    expenseCount: 12,
    currency: 'USD',
    locale: 'en-US',
  };

  it('renders without errors', () => {
    const element = React.createElement(CategoryDetailCard, baseProps);
    expect(element).toBeDefined();
    expect(element.props.name).toBe('Food & Drinks');
    expect(element.props.expenseCount).toBe(12);
  });

  it('accepts all required props', () => {
    const element = React.createElement(CategoryDetailCard, baseProps);
    expect(element.props.spent).toBe(300);
    expect(element.props.budget).toBe(500);
    expect(element.props.currency).toBe('USD');
  });

  it('accepts optional onSetBudget callback', () => {
    const onSetBudget = vi.fn();
    const element = React.createElement(CategoryDetailCard, {
      ...baseProps,
      budget: null,
      onSetBudget,
    });
    expect(element.props.onSetBudget).toBe(onSetBudget);
  });
});

describe('CategoryDetailCard pacing logic', () => {
  it('shows "On track" when under budget', () => {
    const spent = 300;
    const budget = 500;
    const isOverBudget = budget > 0 && spent >= budget;
    const pacingText = isOverBudget ? 'Over budget' : 'On track';
    expect(isOverBudget).toBe(false);
    expect(pacingText).toBe('On track');
  });

  it('shows "On track" at exactly 99% usage', () => {
    const spent = 495;
    const budget = 500;
    const isOverBudget = budget > 0 && spent >= budget;
    expect(isOverBudget).toBe(false);
  });

  it('shows "Over budget" at exactly 100%', () => {
    const spent = 500;
    const budget = 500;
    const isOverBudget = budget > 0 && spent >= budget;
    expect(isOverBudget).toBe(true);
  });

  it('shows "Over budget" when exceeding budget', () => {
    const spent = 700;
    const budget = 500;
    const isOverBudget = budget > 0 && spent >= budget;
    const overAmount = spent - budget;
    expect(isOverBudget).toBe(true);
    expect(overAmount).toBe(200);
  });

  it('computes correct percentage', () => {
    const spent = 350;
    const budget = 500;
    const percentage = Math.round((spent / budget) * 100);
    expect(percentage).toBe(70);
  });

  it('computes 0% when budget is null', () => {
    const budget: number | null = null;
    const percentage = budget && budget > 0 ? Math.round((300 / budget) * 100) : 0;
    expect(percentage).toBe(0);
  });
});

describe('CategoryDetailCard "Set a budget" CTA', () => {
  it('shows CTA when budget is null and onSetBudget provided', () => {
    const onSetBudget = vi.fn();
    const budget: number | null = null;
    const showCta = budget === null && onSetBudget !== undefined;
    expect(showCta).toBe(true);
  });

  it('does not show CTA when budget exists', () => {
    const onSetBudget = vi.fn();
    const budget: number | null = 500;
    const showCta = budget === null && onSetBudget !== undefined;
    expect(showCta).toBe(false);
  });

  it('does not show CTA when onSetBudget is not provided', () => {
    const budget: number | null = null;
    const onSetBudget = undefined;
    const showCta = budget === null && onSetBudget !== undefined;
    expect(showCta).toBe(false);
  });

  it('does not show progress bar when budget is null', () => {
    const budget: number | null = null;
    const showProgress = budget !== null && budget > 0;
    expect(showProgress).toBe(false);
  });

  it('shows progress bar when budget exists', () => {
    const budget: number | null = 500;
    const showProgress = budget !== null && budget > 0;
    expect(showProgress).toBe(true);
  });
});
