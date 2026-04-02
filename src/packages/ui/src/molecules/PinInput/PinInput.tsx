import { XStack, Text } from 'tamagui';
import { OTPInput, type SlotProps, REGEXP_ONLY_DIGITS } from 'input-otp';

export interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

function PinSlot(props: SlotProps) {
  return (
    <XStack
      width={48}
      height={56}
      alignItems="center"
      justifyContent="center"
      borderWidth={2}
      borderColor={props.isActive ? '$brandPrimary' : '$borderDefault'}
      borderRadius="$md"
      backgroundColor="$backgroundInput"
    >
      <Text fontFamily="$body" fontSize={24} fontWeight="600" color="$textPrimary">
        {props.char ?? ''}
      </Text>
    </XStack>
  );
}

export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
}: PinInputProps) {
  return (
    <OTPInput
      maxLength={length}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      autoFocus={autoFocus}
      disabled={disabled}
      render={({ slots }) => (
        <XStack gap="$sm" justifyContent="center">
          {slots.map((slot, idx) => (
            <PinSlot key={idx} {...slot} />
          ))}
        </XStack>
      )}
    />
  );
}
