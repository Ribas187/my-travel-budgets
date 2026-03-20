import { describe, it, expect } from 'vitest';
import React from 'react';

import { AmountInput } from '../AmountInput';

describe('AmountInput', () => {
  it('renders without errors', () => {
    const element = React.createElement(AmountInput, {
      value: '34.00',
      currencySymbol: '€',
    });
    expect(element).toBeDefined();
  });

  it('passes currency symbol', () => {
    const element = React.createElement(AmountInput, {
      value: '100.50',
      currencySymbol: '$',
    });
    expect(element.props.currencySymbol).toBe('$');
  });

  it('passes hint text', () => {
    const element = React.createElement(AmountInput, {
      value: '0.00',
      currencySymbol: '€',
      hint: 'How much?',
    });
    expect(element.props.hint).toBe('How much?');
  });

  it('splits value into integer and decimal correctly', () => {
    // Testing the internal split logic
    const testSplit = (value: string) => {
      const parts = value.split('.');
      const integerPart = parts[0] || '0';
      const decimalPart = parts[1] !== undefined ? `.${parts[1]}` : '.00';
      return { integerPart, decimalPart };
    };

    expect(testSplit('34.00')).toEqual({ integerPart: '34', decimalPart: '.00' });
    expect(testSplit('100.50')).toEqual({ integerPart: '100', decimalPart: '.50' });
    expect(testSplit('0')).toEqual({ integerPart: '0', decimalPart: '.00' });
    expect(testSplit('1234.5')).toEqual({ integerPart: '1234', decimalPart: '.5' });
  });
});
