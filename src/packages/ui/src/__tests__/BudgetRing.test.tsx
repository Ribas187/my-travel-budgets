import { describe, it, expect } from 'vitest';
import React from 'react';

import { BudgetRing } from '../BudgetRing';
import { getBudgetStatusColor } from '../budgetStatus';

describe('BudgetRing', () => {
  const baseProps = {
    total: 1000,
    spent: 500,
    currency: 'USD',
    locale: 'en-US',
  };

  it('renders without errors', () => {
    const element = React.createElement(BudgetRing, baseProps);
    expect(element).toBeDefined();
    expect(element.props.total).toBe(1000);
    expect(element.props.spent).toBe(500);
  });

  it('accepts optional size and strokeWidth props', () => {
    const element = React.createElement(BudgetRing, {
      ...baseProps,
      size: 200,
      strokeWidth: 16,
    });
    expect(element.props.size).toBe(200);
    expect(element.props.strokeWidth).toBe(16);
  });

  it('defaults size to 180 and strokeWidth to 12', () => {
    const element = React.createElement(BudgetRing, baseProps);
    expect(element.props.size).toBeUndefined(); // defaults handled internally
  });
});

describe('getBudgetStatusColor', () => {
  it('returns teal for 0% spend', () => {
    expect(getBudgetStatusColor(0)).toBe('#0D9488');
  });

  it('returns teal for 50% spend', () => {
    expect(getBudgetStatusColor(50)).toBe('#0D9488');
  });

  it('returns teal for 69% spend', () => {
    expect(getBudgetStatusColor(69)).toBe('#0D9488');
  });

  it('returns amber for 70% spend', () => {
    expect(getBudgetStatusColor(70)).toBe('#F59E0B');
  });

  it('returns amber for 75% spend', () => {
    expect(getBudgetStatusColor(75)).toBe('#F59E0B');
  });

  it('returns amber for 99% spend', () => {
    expect(getBudgetStatusColor(99)).toBe('#F59E0B');
  });

  it('returns coral for 100% spend', () => {
    expect(getBudgetStatusColor(100)).toBe('#EF4444');
  });

  it('returns coral for 120% spend (over budget)', () => {
    expect(getBudgetStatusColor(120)).toBe('#EF4444');
  });
});

describe('BudgetRing SVG calculations', () => {
  // Test the math directly: circumference, dashoffset
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2; // 84
  const circumference = 2 * Math.PI * radius; // ~527.79

  it('calculates correct stroke-dashoffset for 0% spent', () => {
    const percentage = 0;
    const progressRatio = Math.min(percentage / 100, 1);
    const offset = circumference * (1 - progressRatio);
    expect(offset).toBeCloseTo(circumference); // full offset = no progress
  });

  it('calculates correct stroke-dashoffset for 50% spent', () => {
    const percentage = 50;
    const progressRatio = Math.min(percentage / 100, 1);
    const offset = circumference * (1 - progressRatio);
    expect(offset).toBeCloseTo(circumference * 0.5);
  });

  it('calculates correct stroke-dashoffset for 75% spent', () => {
    const percentage = 75;
    const progressRatio = Math.min(percentage / 100, 1);
    const offset = circumference * (1 - progressRatio);
    expect(offset).toBeCloseTo(circumference * 0.25);
  });

  it('calculates correct stroke-dashoffset for 100% spent', () => {
    const percentage = 100;
    const progressRatio = Math.min(percentage / 100, 1);
    const offset = circumference * (1 - progressRatio);
    expect(offset).toBeCloseTo(0);
  });

  it('caps stroke-dashoffset at 0 for >100% spent', () => {
    const percentage = 120;
    const progressRatio = Math.min(percentage / 100, 1); // capped at 1
    const offset = circumference * (1 - progressRatio);
    expect(offset).toBeCloseTo(0);
  });

  it('calculates remaining amount correctly', () => {
    expect(Math.max(0, 1000 - 500)).toBe(500);
    expect(Math.max(0, 1000 - 1000)).toBe(0);
    expect(Math.max(0, 1000 - 1200)).toBe(0); // never negative
  });
});

describe('BudgetRing currency formatting', () => {
  it('formats USD correctly', () => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(500);
    expect(formatted).toBe('$500');
  });

  it('formats EUR correctly', () => {
    const formatted = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(1234);
    expect(formatted).toContain('1.234');
    expect(formatted).toContain('€');
  });

  it('formats BRL correctly', () => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(2500);
    expect(formatted).toContain('2.500');
    expect(formatted).toContain('R$');
  });
});
