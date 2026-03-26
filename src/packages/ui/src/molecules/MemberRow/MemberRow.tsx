import { XStack, YStack, Text } from 'tamagui';
import { AvatarChip } from '../../atoms';

interface MemberRowProps {
  name: string;
  initial: string;
  avatarColor: string;
  avatarUrl?: string | null;
  roleBadge?: string;
  amount?: string;
  trailing?: React.ReactNode;
  testID?: string;
}

export function MemberRow({ name, initial, avatarColor, avatarUrl, roleBadge, amount, trailing, testID }: MemberRowProps) {
  return (
    <XStack alignItems="center" paddingVertical="$md" gap="$md" data-testid={testID ?? 'member-row'}>
      <XStack flex={1} alignItems="center" gap="$md">
        <AvatarChip name={name} initial={initial} avatarColor={avatarColor} avatarUrl={avatarUrl} role={roleBadge} />
      </XStack>
      {amount && (
        <YStack alignItems="flex-end" flexShrink={0}>
          <Text fontFamily="$body" fontSize={15} fontWeight="700" color="$textPrimary" whiteSpace="nowrap">{amount}</Text>
        </YStack>
      )}
      {trailing}
    </XStack>
  );
}
