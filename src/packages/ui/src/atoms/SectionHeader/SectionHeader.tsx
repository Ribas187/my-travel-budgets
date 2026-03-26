import { XStack, Text } from 'tamagui';

import { Heading } from '../Typography';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical="$sm">
      <Heading level={4}>{title}</Heading>
      {action && (
        <Text
          fontFamily="$body"
          fontSize={14}
          color="$terracotta500"
          fontWeight="600"
          cursor={onAction ? 'pointer' : undefined}
          onPress={onAction}
          role={onAction ? 'button' : undefined}
          hoverStyle={onAction ? { opacity: 0.7 } : undefined}
          pressStyle={onAction ? { opacity: 0.7 } : undefined}
        >
          {action}
        </Text>
      )}
    </XStack>
  );
}
