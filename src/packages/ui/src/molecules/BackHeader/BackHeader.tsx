import { styled, XStack, Text } from 'tamagui';

interface BackHeaderProps {
  title: string;
  onBack: () => void;
  accessibilityLabel?: string;
}

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
      <button
        onClick={onBack}
        aria-label={accessibilityLabel ?? `Back to ${title}`}
        data-testid="back-header-button"
        style={{
          background: 'none',
          border: 'none',
          fontSize: 24,
          color: '#8C8580',
          cursor: 'pointer',
          padding: 4,
          lineHeight: 1,
        }}
      >
        ←
      </button>
      <HeaderTitle>{title}</HeaderTitle>
    </XStack>
  );
}
