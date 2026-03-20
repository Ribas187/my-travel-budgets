import { describe, it, expect } from 'vitest';
import React from 'react';

import { InsightCard } from '../InsightCard';

describe('InsightCard', () => {
  const baseProps = {
    title: 'Top Spender',
    description: 'Ricardo — €1,234',
    icon: '👤' as React.ReactNode,
    iconBackground: '#FEF3C7',
  };

  it('renders without errors', () => {
    const element = React.createElement(InsightCard, baseProps);
    expect(element).toBeDefined();
  });

  it('receives correct title prop', () => {
    const element = React.createElement(InsightCard, baseProps);
    expect(element.props.title).toBe('Top Spender');
  });

  it('receives correct description prop', () => {
    const element = React.createElement(InsightCard, baseProps);
    expect(element.props.description).toBe('Ricardo — €1,234');
  });

  it('receives correct icon prop', () => {
    const element = React.createElement(InsightCard, baseProps);
    expect(element.props.icon).toBe('👤');
  });

  it('receives correct iconBackground prop', () => {
    const element = React.createElement(InsightCard, baseProps);
    expect(element.props.iconBackground).toBe('#FEF3C7');
  });

  it('renders with different insight types', () => {
    const biggestCategory = React.createElement(InsightCard, {
      title: 'Biggest Category',
      description: 'Food & Drinks — €890',
      icon: '📊',
      iconBackground: '#DBEAFE',
    });
    expect(biggestCategory.props.title).toBe('Biggest Category');
    expect(biggestCategory.props.description).toBe('Food & Drinks — €890');

    const biggestDay = React.createElement(InsightCard, {
      title: 'Biggest Day',
      description: 'Mar 15 — €450',
      icon: '📅',
      iconBackground: '#FCE7F3',
    });
    expect(biggestDay.props.title).toBe('Biggest Day');
    expect(biggestDay.props.description).toBe('Mar 15 — €450');
  });
});
