import { useState, useCallback, useRef } from 'react';

export interface UseCalculatorInputOptions {
  maxDigits?: number;
  decimalPlaces?: number;
  initialValue?: number;
}

export interface UseCalculatorInputReturn {
  rawDigits: string;
  displayText: string;
  numericValue: number;
  handleChange: (text: string) => void;
  reset: (value?: number) => void;
}

export function valueToRawDigits(value: number, decimalPlaces: number): string {
  const scaled = Math.round(value * Math.pow(10, decimalPlaces));
  return scaled > 0 ? String(scaled) : '';
}

export function rawDigitsToDisplay(rawDigits: string, decimalPlaces: number): string {
  if (!rawDigits) return '0';
  const padded = rawDigits.padStart(decimalPlaces + 1, '0');
  const integerPart = padded.slice(0, padded.length - decimalPlaces);
  const decimalPart = padded.slice(padded.length - decimalPlaces);
  return `${integerPart}.${decimalPart}`;
}

export function rawDigitsToNumeric(rawDigits: string, decimalPlaces: number): number {
  if (!rawDigits) return 0;
  return parseInt(rawDigits, 10) / Math.pow(10, decimalPlaces);
}

export function processInput(
  text: string,
  prevInput: string,
  currentRaw: string,
  maxDigits: number,
): { newRaw: string; newPrevInput: string } | null {
  const onlyDigits = text.replace(/\D/g, '');

  let newRaw: string;
  if (!onlyDigits && prevInput) {
    // Full clear (e.g., fill('') or select-all + delete)
    newRaw = '';
  } else if (onlyDigits.length < prevInput.length) {
    // Backspace: remove rightmost digit
    newRaw = currentRaw.slice(0, -1);
  } else if (onlyDigits === prevInput) {
    // No change
    return { newRaw: currentRaw, newPrevInput: onlyDigits };
  } else if (onlyDigits.length === prevInput.length && onlyDigits !== prevInput) {
    // Full replacement (e.g., Playwright fill or paste that replaces entire value)
    newRaw = onlyDigits;
  } else {
    // Extract newly added digits
    const addedDigits = onlyDigits.slice(prevInput.length);
    if (!addedDigits) {
      return { newRaw: currentRaw, newPrevInput: onlyDigits };
    }
    newRaw = currentRaw + addedDigits;
  }

  // Enforce max digits
  if (newRaw.length > maxDigits) {
    newRaw = newRaw.slice(0, maxDigits);
  }

  // Strip leading zeros from raw (e.g. "0050" → "50")
  newRaw = newRaw.replace(/^0+/, '');

  const newPrevInput = onlyDigits.length < prevInput.length
    ? prevInput.slice(0, -1)
    : onlyDigits;

  return { newRaw, newPrevInput };
}

export function useCalculatorInput(options: UseCalculatorInputOptions = {}): UseCalculatorInputReturn {
  const { maxDigits = 9, decimalPlaces = 2, initialValue = 0 } = options;
  const [rawDigits, setRawDigits] = useState<string>(() => valueToRawDigits(initialValue, decimalPlaces));
  const prevInputRef = useRef<string>('');

  const handleChange = useCallback(
    (text: string) => {
      const result = processInput(text, prevInputRef.current, rawDigits, maxDigits);
      if (result) {
        if (result.newRaw !== rawDigits) {
          setRawDigits(result.newRaw);
        }
        prevInputRef.current = result.newPrevInput;
      }
    },
    [rawDigits, maxDigits],
  );

  const reset = useCallback(
    (value?: number) => {
      const v = value ?? initialValue;
      const newRaw = valueToRawDigits(v, decimalPlaces);
      setRawDigits(newRaw);
      prevInputRef.current = '';
    },
    [initialValue, decimalPlaces],
  );

  return {
    rawDigits,
    displayText: rawDigitsToDisplay(rawDigits, decimalPlaces),
    numericValue: rawDigitsToNumeric(rawDigits, decimalPlaces),
    handleChange,
    reset,
  };
}
