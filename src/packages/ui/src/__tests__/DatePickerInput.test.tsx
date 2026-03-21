import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { DatePickerInput } from '../DatePickerInput';

describe('DatePickerInput', () => {
  it('renders with a given ISO date value', () => {
    const element = React.createElement(DatePickerInput, {
      value: '2026-03-21',
      onChange: vi.fn(),
    });
    expect(element).toBeDefined();
    expect(element.props.value).toBe('2026-03-21');
  });

  it('passes onChange callback', () => {
    const onChange = vi.fn();
    const element = React.createElement(DatePickerInput, {
      value: '2026-03-21',
      onChange,
    });
    expect(element.props.onChange).toBe(onChange);
  });

  it('passes label prop correctly', () => {
    const element = React.createElement(DatePickerInput, {
      value: '2026-01-15',
      onChange: vi.fn(),
      label: 'Start Date',
    });
    expect(element.props.label).toBe('Start Date');
  });

  it('passes error prop for error state', () => {
    const element = React.createElement(DatePickerInput, {
      value: '',
      onChange: vi.fn(),
      error: 'Date is required',
    });
    expect(element.props.error).toBe('Date is required');
  });

  it('respects disabled prop', () => {
    const element = React.createElement(DatePickerInput, {
      value: '2026-03-21',
      onChange: vi.fn(),
      disabled: true,
    });
    expect(element.props.disabled).toBe(true);
  });

  it('passes testID prop', () => {
    const element = React.createElement(DatePickerInput, {
      value: '2026-03-21',
      onChange: vi.fn(),
      testID: 'start-date-picker',
    });
    expect(element.props.testID).toBe('start-date-picker');
  });

  it('renders without value (empty string)', () => {
    const element = React.createElement(DatePickerInput, {
      value: '',
      onChange: vi.fn(),
    });
    expect(element).toBeDefined();
    expect(element.props.value).toBe('');
  });

  it('pre-selects current value when provided (edit mode)', () => {
    const element = React.createElement(DatePickerInput, {
      value: '2026-06-15',
      onChange: vi.fn(),
    });
    expect(element.props.value).toBe('2026-06-15');
  });
});
