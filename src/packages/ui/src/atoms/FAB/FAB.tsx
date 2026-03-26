import { styled, XStack, Text } from 'tamagui';

const FABFrame = styled(XStack, {
  width: 56,
  height: 56,
  borderRadius: '$full',
  backgroundColor: '$brandPrimary',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  // elevation.fab shadow
  shadowColor: '$brandPrimary',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 16,

  pressStyle: {
    scale: 0.95,
    opacity: 0.9,
  },
});

const PlusIcon = styled(Text, {
  color: '$white',
  fontSize: 26,
  fontWeight: '300',
  lineHeight: 26,
});

interface FABProps {
  onPress?: () => void;
  accessibilityLabel: string;
}

export function FAB({ onPress, accessibilityLabel }: FABProps) {
  return (
    <FABFrame
      onPress={onPress}
      role="button"
      aria-label={accessibilityLabel}
      data-testid="fab-button"
    >
      <PlusIcon>+</PlusIcon>
    </FABFrame>
  );
}
