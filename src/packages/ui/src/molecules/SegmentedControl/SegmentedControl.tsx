import { XStack, Text } from 'tamagui';

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function SegmentedControl({ options, value, onChange, ariaLabel }: SegmentedControlProps) {
  return (
    <XStack
      width="100%"
      borderRadius="$lg"
      backgroundColor="$backgroundSecondary"
      padding={3}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <XStack
            key={option.value}
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$sm"
            borderRadius="$md"
            backgroundColor={selected ? '$background' : 'transparent'}
            cursor="pointer"
            onPress={() => onChange(option.value)}
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            tabIndex={0}
            data-value={option.value}
            hoverStyle={{
              opacity: selected ? 1 : 0.8,
            }}
          >
            <Text
              fontFamily="$body"
              fontSize={13}
              fontWeight={selected ? '600' : '400'}
              color={selected ? '$textPrimary' : '$textSecondary'}
            >
              {option.label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}
