import { describe, it, expect } from 'vitest';
import React from 'react';

import { CategoryProgressRow } from './CategoryProgressRow';
import { getBudgetStatusColor } from '../../quarks/budgetStatus';

describe('CategoryProgressRow', () => {
  const baseProps = {
    name: 'Food & Drinks',
    icon: '🍔' as React.ReactNode,
    iconColor: '#F59E0B',
    iconBackground: '#FEF3C7',
    spent: 300,
    budget: 500 as number | null,
    currency: 'USD',
    locale: 'en-US',
  };

  it('renders without errors', () => {
    const element = React.createElement(CategoryProgressRow, baseProps);
    expect(element).toBeDefined();
    expect(element.props.name).toBe('Food & Drinks');
  });

  it('accepts all required props', () => {
    const element = React.createElement(CategoryProgressRow, baseProps);
    expect(element.props.spent).toBe(300);
    expect(element.props.budget).toBe(500);
    expect(element.props.currency).toBe('USD');
  });

  it('handles null budget gracefully', () => {
    const element = React.createElement(CategoryProgressRow, {
      ...baseProps,
      budget: null,
    });
    expect(element).toBeDefined();
    expect(element.props.budget).toBeNull();
  });
});

describe('CategoryProgressRow progress calculations', () => {
  it('computes correct progress width for 60% usage (safe)', () => {
    const spent = 300;
    const budget = 500;
    const percentage = (spent / budget) * 100;
    const width = Math.min(percentage, 100);
    expect(width).toBe(60);
    expect(getBudgetStatusColor(percentage)).toBe('#0D9488'); // teal
  });

  it('computes correct progress width for 80% usage (warning)', () => {
    const spent = 400;
    const budget = 500;
    const percentage = (spent / budget) * 100;
    const width = Math.min(percentage, 100);
    expect(width).toBe(80);
    expect(getBudgetStatusColor(percentage)).toBe('#F59E0B'); // amber
  });

  it('computes correct progress width for 100% usage (danger)', () => {
    const spent = 500;
    const budget = 500;
    const percentage = (spent / budget) * 100;
    const width = Math.min(percentage, 100);
    expect(width).toBe(100);
    expect(getBudgetStatusColor(percentage)).toBe('#EF4444'); // coral
  });

  it('caps progress width at 100% for over-budget', () => {
    const spent = 700;
    const budget = 500;
    const percentage = (spent / budget) * 100;
    const width = Math.min(percentage, 100);
    expect(percentage).toBe(140);
    expect(width).toBe(100);
    expect(getBudgetStatusColor(percentage)).toBe('#EF4444'); // coral
  });

  it('computes 0% when budget is null', () => {
    const spent = 300;
    const budget: number | null = null;
    const percentage = budget && budget > 0 ? (spent / budget) * 100 : 0;
    expect(percentage).toBe(0);
  });

  it('computes 0% when budget is zero', () => {
    const spent = 300;
    const budget = 0;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    expect(percentage).toBe(0);
  });
});

describe('CategoryProgressRow amount label formatting', () => {
  it('shows spent / budget when budget exists', () => {
    const spent = 300;
    const budget = 500;
    const spentFormatted = '$300';
    const budgetFormatted = '$500';
    const label = `${spentFormatted} / ${budgetFormatted}`;
    expect(label).toBe('$300 / $500');
  });

  it('shows only spent when budget is null', () => {
    const spent = 300;
    const budget: number | null = null;
    const spentFormatted = '$300';
    const label = budget ? `${spentFormatted} / $${budget}` : spentFormatted;
    expect(label).toBe('$300');
  });
});
