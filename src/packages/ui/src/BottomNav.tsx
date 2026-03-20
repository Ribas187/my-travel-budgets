import { type ReactNode } from 'react'
import { styled, XStack, YStack, Text, View } from 'tamagui'

const NavFrame = styled(XStack, {
  backgroundColor: '$white',
  borderTopWidth: 1,
  borderTopColor: '$borderDefault',
  paddingTop: 10,
  paddingBottom: 28,
  paddingHorizontal: '$lg',
  alignItems: 'flex-end',
  justifyContent: 'space-around',
})

const TabButton = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  minWidth: 56,
  minHeight: 44,
  cursor: 'pointer',
})

const TabIcon = styled(View, {
  width: 22,
  height: 22,
  alignItems: 'center',
  justifyContent: 'center',
})

const TabLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 11,
  lineHeight: 14,

  variants: {
    active: {
      true: {
        fontWeight: '700',
        color: '$brandPrimary',
      },
      false: {
        fontWeight: '600',
        color: '$textTertiary',
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
})

const FABSlot = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: -32,
})

interface NavTab {
  key: string
  label: string
  icon: ReactNode
}

interface BottomNavProps {
  tabs: NavTab[]
  activeTab: string
  onTabPress: (key: string) => void
  fabSlot?: ReactNode
}

export function BottomNav({ tabs, activeTab, onTabPress, fabSlot }: BottomNavProps) {
  const midpoint = Math.floor(tabs.length / 2)

  return (
    <NavFrame role="navigation" aria-label="Main navigation">
      {tabs.map((tab, index) => {
        if (fabSlot && index === midpoint) {
          return (
            <XStack key="__fab_and_tab" alignItems="flex-end">
              <FABSlot>{fabSlot}</FABSlot>
            </XStack>
          )
        }

        const isActive = tab.key === activeTab
        const adjustedIndex = fabSlot && index > midpoint ? index : index

        return (
          <TabButton
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
          >
            <TabIcon
              {...(isActive
                ? { opacity: 1 }
                : { opacity: 0.6 })}
            >
              {tab.icon}
            </TabIcon>
            <TabLabel active={isActive}>{tab.label}</TabLabel>
          </TabButton>
        )
      })}
    </NavFrame>
  )
}
