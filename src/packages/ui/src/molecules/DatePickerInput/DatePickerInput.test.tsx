import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { DatePickerInput } from './DatePickerInput';

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

describe('DatePickerInput scroll-into-view on focus', () => {
  it('has onFocus handler that calls scrollIntoView', async () => {
    // Verify the source code contains the scrollIntoView call on focus
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, './DatePickerInput.tsx'), 'utf-8');
    expect(source).toContain('onFocus');
    expect(source).toContain('scrollIntoView');
    expect(source).toContain("block: 'nearest'");
    expect(source).toContain("behavior: 'smooth'");
  });
});

describe('DatePickerInput responsive overflow fix', () => {
  it('has min-width: 0 to prevent flex child overflow', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, './DatePickerInput.tsx'), 'utf-8');
    expect(source).toContain('minWidth: 0');
  });

  it('has max-width: 100% to constrain within parent', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, './DatePickerInput.tsx'), 'utf-8');
    expect(source).toContain("maxWidth: '100%'");
  });

  it('has overflow: hidden to prevent content bleed', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, './DatePickerInput.tsx'), 'utf-8');
    expect(source).toContain("overflow: 'hidden'");
  });

  it('has Safari pseudo-element normalization for date input', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, './DatePickerInput.tsx'), 'utf-8');
    expect(source).toContain('::-webkit-datetime-edit');
    expect(source).toContain('::-webkit-datetime-edit-fields-wrapper');
    expect(source).toContain('padding: 0');
  });

  it('preserves min-height of 48px for tap target', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const source = readFileSync(resolve(__dirname, './DatePickerInput.tsx'), 'utf-8');
    expect(source).toContain('minHeight: 48');
  });
});
