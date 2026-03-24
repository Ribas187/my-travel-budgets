import { useCallback, useRef } from 'react';
import { styled, YStack, Text } from 'tamagui';

export interface DatePickerInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  testID?: string;
  disabled?: boolean;
}

const ErrorText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  color: '$statusDanger',
});

const LabelText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '600',
  color: '$textTertiary',
  marginBottom: '$xs',
});

export function DatePickerInput({
  value,
  onChange,
  label,
  error,
  testID,
  disabled = false,
}: DatePickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  return (
    <YStack testID={testID}>
      {label && <LabelText>{label}</LabelText>}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        disabled={disabled}
        aria-label={label}
        data-testid={testID ? `${testID}-input` : 'date-picker-input'}
        style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: 16,
          padding: '12px 16px',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: error ? '#EF4444' : 'rgba(26, 24, 21, 0.06)',
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          color: '#1A1815',
          minHeight: 48,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {error && (
        <ErrorText testID={testID ? `${testID}-error` : 'date-picker-error'}>
          {error}
        </ErrorText>
      )}
    </YStack>
  );
}
