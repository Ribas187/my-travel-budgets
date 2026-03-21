import { useState, useCallback, useEffect } from 'react';
import { styled, XStack, YStack, Text, Input, Popover, Adapt } from 'tamagui';
import { DayPicker } from 'react-day-picker';
import { parse, isValid } from 'date-fns';
import type { Locale } from 'date-fns';

export interface DatePickerInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  testID?: string;
  disabled?: boolean;
  locale?: Locale;
}

const StyledInput = styled(Input, {
  fontFamily: '$body',
  fontSize: 16,
  borderWidth: 0,
  color: '$textPrimary',
  flex: 1,
  minHeight: 44,
  backgroundColor: 'transparent',
  outlineStyle: 'none',
});

const InputContainer = styled(XStack, {
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingHorizontal: '$lg',
  alignItems: 'center',
  minHeight: 48,
  backgroundColor: '$backgroundCard',
  cursor: 'pointer',
  focusStyle: {
    borderColor: '$brandPrimary',
  },
  variants: {
    hasError: {
      true: {
        borderColor: '$statusDanger',
      },
    },
    isDisabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  } as const,
});

const CalendarButton = styled(Text, {
  fontSize: 20,
  color: '$textTertiary',
  padding: '$xs',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.7,
  },
});

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

function parseISODate(isoString: string): Date | undefined {
  if (!isoString) return undefined;
  const date = new Date(isoString + 'T00:00:00');
  return isNaN(date.getTime()) ? undefined : date;
}

function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(isoString: string, locale?: string): string {
  if (!isoString) return '';
  const date = parseISODate(isoString);
  if (!date) return isoString;
  try {
    return new Intl.DateTimeFormat(locale ?? 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

const CALENDAR_STYLES: React.CSSProperties = {
  fontFamily: 'Nunito, sans-serif',
  fontSize: 14,
};

const CALENDAR_CLASS_NAMES = {
  today: 'rdp-today-custom',
  selected: 'rdp-selected-custom',
  day_button: 'rdp-day-button-custom',
};

export function DatePickerInput({
  value,
  onChange,
  placeholder,
  label,
  error,
  testID,
  disabled = false,
  locale,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [month, setMonth] = useState<Date>(() => parseISODate(value) ?? new Date());

  const selectedDate = parseISODate(value);

  // Update month when value changes externally
  useEffect(() => {
    const date = parseISODate(value);
    if (date) {
      setMonth(date);
    }
  }, [value]);

  // Close popover on Escape key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const displayValue = isTyping ? textValue : formatDisplayDate(value, locale?.code);

  const handleDaySelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(toISODateString(date));
        setIsTyping(false);
        setOpen(false);
      }
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (text: string) => {
      setIsTyping(true);
      setTextValue(text);

      // Try to parse various date formats
      const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'MMM d, yyyy'];
      for (const fmt of formats) {
        const parsed = parse(text, fmt, new Date());
        if (isValid(parsed)) {
          onChange(toISODateString(parsed));
          setMonth(parsed);
          return;
        }
      }
    },
    [onChange],
  );

  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      setTextValue(value);
    }
  }, [disabled, value]);

  const handleInputBlur = useCallback(() => {
    setIsTyping(false);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!disabled) {
        setOpen(isOpen);
      }
    },
    [disabled],
  );

  return (
    <YStack testID={testID}>
      {label && <LabelText>{label}</LabelText>}
      <Popover
        open={open}
        onOpenChange={handleOpenChange}
        allowFlip
        stayInFrame
        placement="bottom-start"
      >
        <Popover.Trigger asChild>
          <InputContainer
            hasError={!!error}
            isDisabled={disabled}
            testID={testID ? `${testID}-container` : 'date-picker-container'}
          >
            <StyledInput
              value={displayValue}
              onChangeText={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder ?? 'YYYY-MM-DD'}
              editable={!disabled}
              testID={testID ? `${testID}-input` : 'date-picker-input'}
              aria-label={label}
            />
            <CalendarButton
              onPress={() => !disabled && setOpen(!open)}
              role="button"
              aria-label="Open calendar"
              testID={testID ? `${testID}-calendar-button` : 'date-picker-calendar-button'}
            >
              📅
            </CalendarButton>
          </InputContainer>
        </Popover.Trigger>

        <Popover.Content
          padding="$md"
          borderRadius="$lg"
          backgroundColor="$backgroundCard"
          borderWidth={1}
          borderColor="$borderDefault"
          elevate
          animation="fast"
          enterStyle={{ opacity: 0, scale: 0.95 }}
          exitStyle={{ opacity: 0, scale: 0.95 }}
          zIndex={100000}
        >
          <Popover.Arrow borderWidth={1} borderColor="$borderDefault" />
          <style>{`
            .rdp-today-custom .rdp-day-button-custom {
              border: 2px solid #C2410C;
              border-radius: 9999px;
            }
            .rdp-selected-custom .rdp-day-button-custom {
              background-color: #C2410C;
              color: #FFFFFF;
              border-radius: 9999px;
            }
            .rdp-day-button-custom {
              border-radius: 9999px;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              border: 2px solid transparent;
              font-family: Nunito, sans-serif;
            }
            .rdp-day-button-custom:hover {
              background-color: rgba(26, 24, 21, 0.06);
              border-radius: 9999px;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            month={month}
            onMonthChange={setMonth}
            locale={locale}
            style={CALENDAR_STYLES}
            classNames={CALENDAR_CLASS_NAMES}
            showOutsideDays
          />
        </Popover.Content>

        <Adapt when="mobile">
          <Popover.Sheet modal dismissOnSnapToBottom>
            <Popover.Sheet.Frame padding="$lg">
              <Adapt.Contents />
            </Popover.Sheet.Frame>
            <Popover.Sheet.Overlay />
          </Popover.Sheet>
        </Adapt>
      </Popover>
      {error && <ErrorText testID={testID ? `${testID}-error` : 'date-picker-error'}>{error}</ErrorText>}
    </YStack>
  );
}
