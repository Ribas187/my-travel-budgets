import { type ReactNode, useEffect } from 'react';
import { User } from 'lucide-react';
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
  userInitial?: string;
  showIconFallback?: boolean;
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
  showIconFallback,
  items,
}: NavigationSheetProps) {
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const handleKeyDown = (e: Event) => {
      if ((e as unknown as { key: string }).key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

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
        data-testid="navigation-sheet"
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
            {showIconFallback ? (
              <User size={20} color="white" aria-hidden={userName ? 'true' : undefined} role={!userName ? 'img' : undefined} aria-label={!userName ? 'User' : undefined} />
            ) : (
              <InitialText>{userInitial}</InitialText>
            )}
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
              data-testid={`nav-sheet-item-${item.key}`}
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
