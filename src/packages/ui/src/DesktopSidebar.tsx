import { type ReactNode } from 'react'
import { styled, XStack, YStack, Text, View } from 'tamagui'

const SidebarFrame = styled(YStack, {
  width: 260,
  backgroundColor: '$white',
  borderRightWidth: 1,
  borderRightColor: '$borderDefault',
  paddingVertical: 28,
  paddingHorizontal: 20,
  justifyContent: 'space-between',
  height: '100%',
})

const NavItem = styled(XStack, {
  alignItems: 'center',
  gap: '$md',
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: '$lg',
  cursor: 'pointer',
  minHeight: 44,

  variants: {
    active: {
      true: {
        backgroundColor: 'rgba(194, 65, 12, 0.08)',
      },
      false: {
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: '$backgroundSecondary',
        },
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
})

const NavIcon = styled(View, {
  width: 20,
  height: 20,
  alignItems: 'center',
  justifyContent: 'center',
})

const NavLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  lineHeight: 22,

  variants: {
    active: {
      true: {
        color: '$brandPrimary',
      },
      false: {
        color: '$textSecondary',
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
})

interface SidebarNavItem {
  key: string
  label: string
  icon: ReactNode
}

interface DesktopSidebarProps {
  logo?: ReactNode
  navItems: SidebarNavItem[]
  activeItem: string
  onItemPress: (key: string) => void
  footerItems?: SidebarNavItem[]
  userSection?: ReactNode
}

export function DesktopSidebar({
  logo,
  navItems,
  activeItem,
  onItemPress,
  footerItems,
  userSection,
}: DesktopSidebarProps) {
  return (
    <SidebarFrame role="navigation" aria-label="Sidebar navigation">
      <YStack gap="$xs">
        {logo && (
          <XStack paddingVertical="$md" paddingHorizontal={14} marginBottom="$lg">
            {logo}
          </XStack>
        )}

        <YStack gap="$xs">
          {navItems.map((item) => {
            const isActive = item.key === activeItem
            return (
              <NavItem
                key={item.key}
                active={isActive}
                onPress={() => onItemPress(item.key)}
                role="link"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <NavIcon>{item.icon}</NavIcon>
                <NavLabel active={isActive}>{item.label}</NavLabel>
              </NavItem>
            )
          })}
        </YStack>
      </YStack>

      <YStack gap="$sm">
        {footerItems?.map((item) => {
          const isActive = item.key === activeItem
          return (
            <NavItem
              key={item.key}
              active={isActive}
              onPress={() => onItemPress(item.key)}
              aria-label={item.label}
            >
              <NavIcon>{item.icon}</NavIcon>
              <NavLabel active={isActive}>{item.label}</NavLabel>
            </NavItem>
          )
        })}
        {userSection}
      </YStack>
    </SidebarFrame>
  )
}
