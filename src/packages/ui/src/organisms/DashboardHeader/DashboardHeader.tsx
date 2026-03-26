import { XStack } from 'tamagui';
import { Heading, UserAvatar } from '../../atoms';

interface DashboardHeaderProps {
  travelName: string;
  userName: string;
  avatarUrl: string | null;
  onAvatarPress?: () => void;
  openMenuLabel?: string;
}

export function DashboardHeader({ travelName, userName, avatarUrl, onAvatarPress, openMenuLabel = 'Open navigation menu' }: DashboardHeaderProps) {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$screenPaddingHorizontal" paddingTop="$lg" paddingBottom="$sm">
      <Heading level={3}>{travelName}</Heading>
      <XStack onPress={onAvatarPress} cursor="pointer" pressStyle={{ opacity: 0.7 }} role="button" aria-label={openMenuLabel} data-testid="header-avatar">
        <UserAvatar avatarUrl={avatarUrl} name={userName} size={36} />
      </XStack>
    </XStack>
  );
}
