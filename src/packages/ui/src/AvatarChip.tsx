import { styled, XStack, YStack, Text, View } from 'tamagui';

const ChipFrame = styled(XStack, {
  alignItems: 'center',
  gap: '$sm',
});

const AvatarCircle = styled(XStack, {
  width: 28,
  height: 28,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
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
  initial: string;
  avatarColor?: string;
  role?: string;
  onPress?: () => void;
}

export function AvatarChip({ name, initial, avatarColor, role, onPress }: AvatarChipProps) {
  return (
    <ChipFrame onPress={onPress} cursor={onPress ? 'pointer' : undefined}>
      <AvatarCircle backgroundColor={avatarColor || '$brandPrimary'}>
        <InitialText>{initial}</InitialText>
      </AvatarCircle>
      <YStack>
        <XStack alignItems="center" gap="$xs">
          <NameText>{name}</NameText>
          {role && (
            <RoleBadge>
              <RoleBadgeText>{role}</RoleBadgeText>
            </RoleBadge>
          )}
        </XStack>
      </YStack>
    </ChipFrame>
  );
}
