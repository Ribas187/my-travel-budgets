import { styled, XStack, YStack, Text, View } from 'tamagui';
import type { CategoryColor } from '@repo/core';

const PaletteGrid = styled(XStack, {
  flexWrap: 'wrap',
  gap: '$sm',
});

const SwatchButton = styled(View, {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderWidth: 2,
  borderColor: 'transparent',

  variants: {
    selected: {
      true: {
        borderColor: '$textPrimary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
});

const SwatchInner = styled(View, {
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
});

const CheckmarkText = styled(Text, {
  fontSize: 14,
  color: 'white',
  fontWeight: '700',
});

const CurrentLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 11,
  color: '$textTertiary',
  textAlign: 'center',
  marginTop: 2,
});

interface ColorPickerProps {
  colors: CategoryColor[];
  selectedColor: string;
  onSelect: (hex: string) => void;
  currentLabel?: string;
}

export function ColorPicker({ colors, selectedColor, onSelect, currentLabel = 'Current' }: ColorPickerProps) {
  const isInCuratedSet = colors.some((c) => c.hex === selectedColor);
  const allItems = isInCuratedSet
    ? colors
    : [{ hex: selectedColor, name: currentLabel }, ...colors];

  return (
    <PaletteGrid role="radiogroup" aria-label="Color palette">
      {allItems.map((color) => {
        const isSelected = color.hex === selectedColor;
        const isCurrent = !isInCuratedSet && color.name === currentLabel;

        return (
          <YStack key={color.hex} alignItems="center">
            <SwatchButton
              selected={isSelected}
              onPress={() => onSelect(color.hex)}
              role="radio"
              aria-checked={isSelected}
              aria-selected={isSelected}
              aria-label={color.name}
              tabIndex={0}
            >
              <SwatchInner backgroundColor={color.hex}>
                {isSelected && <CheckmarkText>✓</CheckmarkText>}
              </SwatchInner>
            </SwatchButton>
            {isCurrent && <CurrentLabel>{currentLabel}</CurrentLabel>}
          </YStack>
        );
      })}
    </PaletteGrid>
  );
}
