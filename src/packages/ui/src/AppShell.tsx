import { type ReactNode } from 'react'
import { styled, XStack, YStack, useMedia } from 'tamagui'

const ShellFrame = styled(XStack, {
  flex: 1,
  height: '100%',
  backgroundColor: '$backgroundPrimary',
})

const ContentArea = styled(YStack, {
  flex: 1,
  overflow: 'hidden',
})

const MobileFrame = styled(YStack, {
  flex: 1,
  height: '100%',
  backgroundColor: '$backgroundPrimary',
})

const MobileContent = styled(YStack, {
  flex: 1,
  overflow: 'hidden',
})

interface AppShellProps {
  children: ReactNode
  sidebar?: ReactNode
  bottomNav?: ReactNode
}

export function AppShell({ children, sidebar, bottomNav }: AppShellProps) {
  const media = useMedia()
  const isDesktop = media.gtMobile

  if (isDesktop && sidebar) {
    return (
      <ShellFrame>
        {sidebar}
        <ContentArea>{children}</ContentArea>
      </ShellFrame>
    )
  }

  return (
    <MobileFrame>
      <MobileContent>{children}</MobileContent>
      {bottomNav}
    </MobileFrame>
  )
}
