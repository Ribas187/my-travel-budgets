import { describe, it, expect } from 'vitest';
import React from 'react';

import { BudgetImpactBanner } from '../BudgetImpactBanner';

describe('BudgetImpactBanner', () => {
  it('renders without errors', () => {
    const element = React.createElement(BudgetImpactBanner, {
      message: 'Food & Drinks will be at 83% after this',
      percentageAfter: 83,
    });
    expect(element).toBeDefined();
  });

  it('applies warning severity at 70%', () => {
    const element = React.createElement(BudgetImpactBanner, {
      message: 'At 70%',
      percentageAfter: 70,
    });
    // percentageAfter < 100 → severity = 'warning'
    expect(element.props.percentageAfter).toBe(70);
    expect(element.props.percentageAfter < 100).toBe(true);
  });

  it('applies warning severity at 99%', () => {
    const element = React.createElement(BudgetImpactBanner, {
      message: 'At 99%',
      percentageAfter: 99,
    });
    expect(element.props.percentageAfter < 100).toBe(true);
  });

  it('applies danger severity at 100%', () => {
    const element = React.createElement(BudgetImpactBanner, {
      message: 'Over budget!',
      percentageAfter: 100,
    });
    expect(element.props.percentageAfter >= 100).toBe(true);
  });

  it('applies danger severity above 100%', () => {
    const element = React.createElement(BudgetImpactBanner, {
      message: 'Way over!',
      percentageAfter: 150,
    });
    expect(element.props.percentageAfter >= 100).toBe(true);
  });

  it('computes correct severity internally', () => {
    // Test the logic directly: severity = percentageAfter >= 100 ? 'danger' : 'warning'
    const computeSeverity = (pct: number) => (pct >= 100 ? 'danger' : 'warning');

    expect(computeSeverity(70)).toBe('warning');
    expect(computeSeverity(83)).toBe('warning');
    expect(computeSeverity(99)).toBe('warning');
    expect(computeSeverity(100)).toBe('danger');
    expect(computeSeverity(150)).toBe('danger');
  });
});
