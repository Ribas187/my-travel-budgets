import { User } from 'lucide-react';
import { styled, XStack, YStack, Text, View } from 'tamagui';

const ChipFrame = styled(XStack, {
  alignItems: 'center',
  gap: '$sm',
  flex: 1,
  minWidth: 0,
});

const AvatarCircle = styled(XStack, {
  width: 28,
  height: 28,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const InitialText = styled(Text, {
  fontFamily: '$heading',
  fontSize: 14,
  fontWeight: '600',
  color: '$white',
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
  role?: string;
  onPress?: () => void;
}

export function AvatarChip({ name, initial, showIconFallback, avatarColor, role, onPress }: AvatarChipProps) {
  return (
    <ChipFrame onPress={onPress} cursor={onPress ? 'pointer' : undefined}>
      <AvatarCircle backgroundColor={avatarColor || '$brandPrimary'}>
        {showIconFallback ? (
          <User size={16} color="white" aria-hidden={name ? 'true' : undefined} role={!name ? 'img' : undefined} aria-label={!name ? 'User' : undefined} />
        ) : (
          <InitialText>{initial}</InitialText>
        )}
      </AvatarCircle>
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
