import { type ReactNode } from 'react';
import { styled, XStack, YStack, useMedia } from 'tamagui';

const ShellFrame = styled(XStack, {
  flex: 1,
  height: '100%',
  backgroundColor: '$backgroundPrimary',
});

const ContentArea = styled(YStack, {
  flex: 1,
  overflow: 'hidden',
});

const MobileFrame = styled(YStack, {
  flex: 1,
  height: '100%',
  backgroundColor: '$backgroundPrimary',
});

const MobileContent = styled(YStack, {
  flex: 1,
  overflow: 'auto',
});

interface AppShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
  bottomNav?: ReactNode;
}

export function AppShell({ children, sidebar, bottomNav }: AppShellProps) {
  const media = useMedia();
  const isDesktop = media.gtTablet;

  if (isDesktop && sidebar) {
    return (
      <ShellFrame data-testid="app-shell-desktop">
        {sidebar}
        <ContentArea>{children}</ContentArea>
      </ShellFrame>
    );
  }

  return (
    <MobileFrame data-testid="app-shell-mobile">
      <MobileContent data-testid="mobile-content">{children}</MobileContent>
      {bottomNav}
    </MobileFrame>
  );
}
