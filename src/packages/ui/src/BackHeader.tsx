import { styled, XStack, Text } from 'tamagui';

interface BackHeaderProps {
  title: string;
  onBack: () => void;
  accessibilityLabel?: string;
}

const BackArrow = styled(Text, {
  fontSize: 24,
  color: '$textTertiary',
  cursor: 'pointer',
  padding: '$xs',
  pressStyle: {
    opacity: 0.7,
  },
});

const HeaderTitle = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  color: '$textSecondary',
});

export function BackHeader({ title, onBack, accessibilityLabel }: BackHeaderProps) {
  return (
    <XStack
      alignItems="center"
      gap="$xs"
      marginBottom="$lg"
      testID="back-header"
    >
      <BackArrow
        onPress={onBack}
        role="button"
        aria-label={accessibilityLabel ?? `Back to ${title}`}
        testID="back-header-button"
      >
        ←
      </BackArrow>
      <HeaderTitle>{title}</HeaderTitle>
    </XStack>
  );
}
