import { XStack, Text } from 'tamagui';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface NavigationRowLinkProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

export function NavigationRowLink({
  icon,
  label,
  onPress,
  testID,
  accessibilityLabel,
}: NavigationRowLinkProps) {
  return (
    <XStack
      paddingVertical="$md"
      paddingHorizontal="$lg"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="$borderDefault"
      alignItems="center"
      justifyContent="space-between"
      cursor="pointer"
      backgroundColor="$white"
      onPress={onPress}
      data-testid={testID}
      role="button"
      aria-label={accessibilityLabel ?? label}
      tabIndex={0}
    >
      <XStack alignItems="center" gap="$sm">
        {icon}
        <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$textPrimary">
          {label}
        </Text>
      </XStack>
      <ChevronRight size={18} color="#8C8580" />
    </XStack>
  );
}
