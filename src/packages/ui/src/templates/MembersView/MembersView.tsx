import { type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { XStack, YStack, Text, View } from 'tamagui';
import { Heading, PrimaryButton } from '../../atoms';
import { MemberRow, ConfirmDialog } from '../../molecules';
import { InviteMemberForm } from '../../organisms';
import { formatCurrency, getMemberDisplayName, getAvatarColor } from '../../quarks';
import type { TravelMember, MemberSpending } from '@repo/api-client';

export interface MembersViewProps {
  members: TravelMember[];
  memberSpendingMap: Map<string, MemberSpending>;
  currency: string;
  locale: string;
  isOwner: boolean;
  showInviteForm: boolean;
  inviteLoading: boolean;
  memberToRemove: TravelMember | null;
  onShowInviteForm: () => void;
  onInviteByEmail: (email: string) => void;
  onAddGuest: (guestName: string) => void;
  onCancelInvite: () => void;
  onRemoveRequest: (member: TravelMember) => void;
  onRemoveConfirm: () => void;
  onRemoveCancel: () => void;
  inviteButtonRef?: RefObject<HTMLElement | null>;
}

export function MembersView({
  members, memberSpendingMap, currency, locale, isOwner, showInviteForm, inviteLoading,
  memberToRemove, onShowInviteForm, onInviteByEmail, onAddGuest, onCancelInvite,
  onRemoveRequest, onRemoveConfirm, onRemoveCancel, inviteButtonRef,
}: MembersViewProps) {
  const { t } = useTranslation();

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl" gap="$lg" data-testid="members-page">
      <XStack justifyContent="space-between" alignItems="center">
        <Heading level={2}>{t('member.title')}</Heading>
        {isOwner && !showInviteForm && (
          <View ref={inviteButtonRef as RefObject<HTMLElement>}>
            <PrimaryButton label={t('member.add')} onPress={onShowInviteForm} data-testid="invite-button" />
          </View>
        )}
      </XStack>

      {showInviteForm && (
        <InviteMemberForm loading={inviteLoading} onInviteByEmail={onInviteByEmail} onAddGuest={onAddGuest} onCancel={onCancelInvite} />
      )}

      <YStack data-testid="member-list">
        {members.map((member, index) => {
          const displayName = getMemberDisplayName(member);
          const initial = displayName.charAt(0).toUpperCase();
          const spending = memberSpendingMap.get(member.id);
          const isMemberOwner = member.role === 'owner';
          const canRemove = isOwner && !isMemberOwner;
          const roleBadge = member.role === 'owner' ? t('member.owner') : t('member.member');

          return (
            <MemberRow
              key={member.id}
              name={displayName}
              initial={initial}
              avatarColor={getAvatarColor(index)}
              avatarUrl={member.user?.avatarUrl}
              roleBadge={roleBadge}
              amount={spending ? formatCurrency(spending.totalSpent, currency, locale) : undefined}
              trailing={canRemove ? (
                <Text fontFamily="$body" fontSize={13} fontWeight="600" color="$coral500" cursor="pointer" onPress={() => onRemoveRequest(member)} paddingVertical="$xs" paddingHorizontal="$sm" data-testid="remove-member-button">
                  {t('member.remove')}
                </Text>
              ) : undefined}
            />
          );
        })}
      </YStack>

      {memberToRemove && (
        <ConfirmDialog
          open={!!memberToRemove}
          message={t('member.removeConfirm', { name: getMemberDisplayName(memberToRemove) })}
          confirmLabel={t('member.remove')}
          onConfirm={onRemoveConfirm}
          onCancel={onRemoveCancel}
        />
      )}
    </YStack>
  );
}
