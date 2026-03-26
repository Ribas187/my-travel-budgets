import { styled, XStack, YStack, Text, View } from 'tamagui';

import { UserAvatar } from '../UserAvatar/UserAvatar';

const ChipFrame = styled(XStack, {
  alignItems: 'center',
  gap: '$sm',
  flex: 1,
  minWidth: 0,
});

const NameText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  lineHeight: 20,
  color: '$textPrimary',
});

const RoleBadge = styled(View, {
  backgroundColor: '$teal50',
  paddingVertical: 2,
  paddingHorizontal: 8,
  borderRadius: 6,
});

const RoleBadgeText = styled(Text, {
  fontFamily: '$body',
  fontSize: 11,
  fontWeight: '600',
  color: '$teal500',
});

interface AvatarChipProps {
  name: string;
  initial?: string;
  showIconFallback?: boolean;
  avatarColor?: string;
  avatarUrl?: string | null;
  role?: string;
  onPress?: () => void;
}

export function AvatarChip({ name, initial, showIconFallback, avatarColor, avatarUrl, role, onPress }: AvatarChipProps) {
  // Derive the display name for UserAvatar:
  // If showIconFallback is true and no initial, pass empty string so UserAvatar shows the icon fallback
  const avatarName = showIconFallback && !initial ? '' : (initial || name.charAt(0));

  return (
    <ChipFrame onPress={onPress} cursor={onPress ? 'pointer' : undefined}>
      <XStack flexShrink={0}>
        <UserAvatar
          avatarUrl={avatarUrl ?? null}
          name={avatarName}
          size={28}
          backgroundColor={avatarColor}
        />
      </XStack>
      <YStack flex={1} minWidth={0}>
        <XStack alignItems="center" gap="$xs" minWidth={0}>
          <NameText numberOfLines={1} flexShrink={1} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{name}</NameText>
          {role && (
            <RoleBadge flexShrink={0}>
              <RoleBadgeText>{role}</RoleBadgeText>
            </RoleBadge>
          )}
        </XStack>
      </YStack>
    </ChipFrame>
  );
}
