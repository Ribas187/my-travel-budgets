import { describe, it, expect } from 'vitest';

import {
  valueToRawDigits,
  rawDigitsToDisplay,
  rawDigitsToNumeric,
  processInput,
} from './useCalculatorInput';

describe('valueToRawDigits', () => {
  it('converts 0 to empty string', () => {
    expect(valueToRawDigits(0, 2)).toBe('');
  });

  it('converts 25.99 to "2599"', () => {
    expect(valueToRawDigits(25.99, 2)).toBe('2599');
  });

  it('converts 42.5 to "4250"', () => {
    expect(valueToRawDigits(42.5, 2)).toBe('4250');
  });

  it('converts 9999999.99 to "999999999"', () => {
    expect(valueToRawDigits(9999999.99, 2)).toBe('999999999');
  });

  it('converts 0.01 to "1"', () => {
    expect(valueToRawDigits(0.01, 2)).toBe('1');
  });
});

describe('rawDigitsToDisplay', () => {
  it('empty string → "0"', () => {
    expect(rawDigitsToDisplay('', 2)).toBe('0');
  });

  it('"1" → "0.01"', () => {
    expect(rawDigitsToDisplay('1', 2)).toBe('0.01');
  });

  it('"12" → "0.12"', () => {
    expect(rawDigitsToDisplay('12', 2)).toBe('0.12');
  });

  it('"125" → "1.25"', () => {
    expect(rawDigitsToDisplay('125', 2)).toBe('1.25');
  });

  it('"1250" → "12.50"', () => {
    expect(rawDigitsToDisplay('1250', 2)).toBe('12.50');
  });

  it('"2599" → "25.99"', () => {
    expect(rawDigitsToDisplay('2599', 2)).toBe('25.99');
  });

  it('"50" → "0.50"', () => {
    expect(rawDigitsToDisplay('50', 2)).toBe('0.50');
  });

  it('"999999999" → "9999999.99"', () => {
    expect(rawDigitsToDisplay('999999999', 2)).toBe('9999999.99');
  });
});

describe('rawDigitsToNumeric', () => {
  it('empty string → 0', () => {
    expect(rawDigitsToNumeric('', 2)).toBe(0);
  });

  it('"1" → 0.01', () => {
    expect(rawDigitsToNumeric('1', 2)).toBe(0.01);
  });

  it('"1250" → 12.5', () => {
    expect(rawDigitsToNumeric('1250', 2)).toBe(12.5);
  });

  it('"2599" → 25.99', () => {
    expect(rawDigitsToNumeric('2599', 2)).toBe(25.99);
  });

  it('"999999999" → 9999999.99', () => {
    expect(rawDigitsToNumeric('999999999', 2)).toBe(9999999.99);
  });
});

describe('processInput', () => {
  it('adds a single digit from empty state', () => {
    const result = processInput('1', '', '', 9);
    expect(result).toEqual({ newRaw: '1', newPrevInput: '1' });
  });

  it('builds digits sequentially: 1 → 12 → 125 → 1250', () => {
    let raw = '';
    let prev = '';

    let result = processInput('1', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;
    expect(raw).toBe('1');

    result = processInput('12', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;
    expect(raw).toBe('12');

    result = processInput('125', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;
    expect(raw).toBe('125');

    result = processInput('1250', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;
    expect(raw).toBe('1250');
  });

  it('backspace removes rightmost digit', () => {
    // Start with raw "1250", prev "1250"
    const result = processInput('125', '1250', '1250', 9);
    expect(result).toEqual({ newRaw: '125', newPrevInput: '125' });
  });

  it('backspace to empty clears all digits', () => {
    const result = processInput('', '1', '1', 9);
    expect(result).toEqual({ newRaw: '', newPrevInput: '' });
  });

  it('strips leading zeros: "0050" → "50"', () => {
    let raw = '';
    let prev = '';

    // Type 0, 0, 5, 0
    let result = processInput('0', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;
    // Leading zeros stripped, raw stays empty for single '0'
    expect(raw).toBe('');

    result = processInput('00', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;

    result = processInput('005', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;
    expect(raw).toBe('5');

    result = processInput('0050', prev, raw, 9)!;
    raw = result.newRaw;
    prev = result.newPrevInput;
    expect(raw).toBe('50');
  });

  it('enforces max digit cap at 9 digits', () => {
    const result = processInput('1234567890', '', '', 9);
    expect(result!.newRaw).toHaveLength(9);
    expect(result!.newRaw).toBe('123456789');
  });

  it('non-digit characters are stripped: "12.50" → "1250"', () => {
    const result = processInput('12.50', '', '', 9);
    expect(result!.newRaw).toBe('1250');
  });

  it('non-digit characters with letters: "abc123def" → "123"', () => {
    const result = processInput('abc123def', '', '', 9);
    expect(result!.newRaw).toBe('123');
  });

  it('no-op when no new digits are added', () => {
    const result = processInput('123', '123', '123', 9);
    expect(result).toEqual({ newRaw: '123', newPrevInput: '123' });
  });

  it('full replacement: same length but different content', () => {
    // Simulates Playwright fill() replacing "4250" with "5500"
    const result = processInput('5500', '4250', '4250', 9);
    expect(result!.newRaw).toBe('5500');
    expect(result!.newPrevInput).toBe('5500');
  });
});

describe('useCalculatorInput integration (pure function simulation)', () => {
  it('full flow: type "2599" → display "25.99", numeric 25.99', () => {
    let raw = '';
    let prev = '';

    for (const char of ['2', '25', '259', '2599']) {
      const result = processInput(char, prev, raw, 9)!;
      raw = result.newRaw;
      prev = result.newPrevInput;
    }

    expect(rawDigitsToDisplay(raw, 2)).toBe('25.99');
    expect(rawDigitsToNumeric(raw, 2)).toBe(25.99);
  });

  it('type "2599" then backspace → display "2.59", numeric 2.59', () => {
    let raw = '';
    let prev = '';

    for (const char of ['2', '25', '259', '2599']) {
      const result = processInput(char, prev, raw, 9)!;
      raw = result.newRaw;
      prev = result.newPrevInput;
    }

    // Backspace
    const result = processInput('259', prev, raw, 9)!;
    raw = result.newRaw;

    expect(rawDigitsToDisplay(raw, 2)).toBe('2.59');
    expect(rawDigitsToNumeric(raw, 2)).toBe(2.59);
  });

  it('initialValue 25.99 → rawDigits "2599", display "25.99"', () => {
    const raw = valueToRawDigits(25.99, 2);
    expect(raw).toBe('2599');
    expect(rawDigitsToDisplay(raw, 2)).toBe('25.99');
    expect(rawDigitsToNumeric(raw, 2)).toBe(25.99);
  });

  it('reset(42.5) → rawDigits "4250", display "42.50"', () => {
    const raw = valueToRawDigits(42.5, 2);
    expect(raw).toBe('4250');
    expect(rawDigitsToDisplay(raw, 2)).toBe('42.50');
    expect(rawDigitsToNumeric(raw, 2)).toBe(42.5);
  });

  it('supports max value 9,999,999.99 (FR11)', () => {
    const raw = valueToRawDigits(9999999.99, 2);
    expect(raw).toBe('999999999');
    expect(raw).toHaveLength(9);
    expect(rawDigitsToDisplay(raw, 2)).toBe('9999999.99');
    expect(rawDigitsToNumeric(raw, 2)).toBe(9999999.99);
  });
});
