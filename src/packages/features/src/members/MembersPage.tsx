import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MembersView, TooltipTip } from '@repo/ui';
import type { TravelMember, MemberSpending } from '@repo/api-client';
import { useDashboard, useAddMember, useRemoveMember } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';
import { useTip } from '../onboarding/useTip';

export interface MembersPageProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function MembersPage({ onSuccess, onError }: MembersPageProps) {
  const { t, i18n } = useTranslation();
  const { travel, isOwner } = useTravelContext();
  const locale = i18n.language;
  const inviteButtonRef = useRef<HTMLElement>(null);

  const { data: dashboard } = useDashboard(travel.id);
  const addMember = useAddMember(travel.id);
  const removeMember = useRemoveMember(travel.id);
  const { shouldShow: shouldShowTip, dismiss: dismissTip } = useTip('members_invite_button');

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TravelMember | null>(null);

  const memberSpendingMap = useMemo(() => {
    if (!dashboard) return new Map<string, MemberSpending>();
    const map = new Map<string, MemberSpending>();
    for (const ms of dashboard.memberSpending) {
      map.set(ms.memberId, ms);
    }
    return map;
  }, [dashboard]);

  const handleInviteByEmail = useCallback(
    (email: string) => {
      addMember.mutate(
        { email },
        {
          onSuccess: () => {
            onSuccess?.(t('member.added'));
            setShowInviteForm(false);
          },
          onError: () => {
            onError?.(t('member.error'));
          },
        },
      );
    },
    [addMember, t, onSuccess, onError],
  );

  const handleAddGuest = useCallback(
    (guestName: string) => {
      addMember.mutate(
        { guestName },
        {
          onSuccess: () => {
            onSuccess?.(t('member.added'));
            setShowInviteForm(false);
          },
          onError: () => {
            onError?.(t('member.error'));
          },
        },
      );
    },
    [addMember, t, onSuccess, onError],
  );

  const handleConfirmRemove = useCallback(() => {
    if (!memberToRemove) return;
    removeMember.mutate(memberToRemove.id, {
      onSuccess: () => {
        onSuccess?.(t('member.removed'));
        setMemberToRemove(null);
      },
      onError: () => {
        onError?.(t('member.error'));
      },
    });
  }, [memberToRemove, removeMember, t, onSuccess, onError]);

  return (
    <>
      <MembersView
        members={travel.members}
        memberSpendingMap={memberSpendingMap}
        currency={travel.currency}
        locale={locale}
        isOwner={isOwner}
        showInviteForm={showInviteForm}
        inviteLoading={addMember.isPending}
        memberToRemove={memberToRemove}
        onShowInviteForm={() => setShowInviteForm(true)}
        onInviteByEmail={handleInviteByEmail}
        onAddGuest={handleAddGuest}
        onCancelInvite={() => setShowInviteForm(false)}
        onRemoveRequest={setMemberToRemove}
        onRemoveConfirm={handleConfirmRemove}
        onRemoveCancel={() => setMemberToRemove(null)}
        inviteButtonRef={inviteButtonRef}
      />
      {shouldShowTip && (
        <TooltipTip
          tipId="members_invite_button"
          message={t('onboarding.tip.membersInviteButton')}
          dismissLabel={t('onboarding.tip.dismiss')}
          onDismiss={dismissTip}
          anchorRef={inviteButtonRef}
        />
      )}
    </>
  );
}
