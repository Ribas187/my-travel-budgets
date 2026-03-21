import type { ReactNode } from 'react';
import { Sheet, styled, XStack, YStack, Text } from 'tamagui';

interface NavigationSheetItem {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface NavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userInitial: string;
  items: NavigationSheetItem[];
}

const AvatarCircle = styled(XStack, {
  width: 40,
  height: 40,
  borderRadius: '$full',
  backgroundColor: '$brandPrimary',
  alignItems: 'center',
  justifyContent: 'center',
});

const InitialText = styled(Text, {
  fontFamily: '$heading',
  fontSize: 18,
  fontWeight: '600',
  color: '$white',
});

const UserName = styled(Text, {
  fontFamily: '$body',
  fontSize: 16,
  fontWeight: '600',
  color: '$textPrimary',
});

const MenuItem = styled(XStack, {
  alignItems: 'center',
  gap: '$md',
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$backgroundSecondary',
  },
  pressStyle: {
    backgroundColor: '$backgroundSecondary',
  },
});

const MenuLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 16,
  color: '$textPrimary',
  variants: {
    destructive: {
      true: {
        color: '$coral500',
      },
    },
  } as const,
});

export type { NavigationSheetProps, NavigationSheetItem };

export function NavigationSheet({
  open,
  onOpenChange,
  userName,
  userInitial,
  items,
}: NavigationSheetProps) {
  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      dismissOnOverlayPress
      dismissOnSnapToBottom
      snapPoints={[40]}
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame
        backgroundColor="$backgroundPrimary"
        paddingTop="$lg"
        paddingBottom="$2xl"
      >
        <XStack
          alignItems="center"
          gap="$md"
          paddingHorizontal="$lg"
          paddingBottom="$lg"
          borderBottomWidth={1}
          borderBottomColor="$borderSubtle"
        >
          <AvatarCircle>
            <InitialText>{userInitial}</InitialText>
          </AvatarCircle>
          <UserName>{userName}</UserName>
        </XStack>

        <YStack paddingTop="$md">
          {items.map((item) => (
            <MenuItem
              key={item.key}
              onPress={item.onPress}
              role="button"
              aria-label={item.label}
            >
              {item.icon}
              <MenuLabel destructive={item.destructive}>
                {item.label}
              </MenuLabel>
            </MenuItem>
          ))}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
