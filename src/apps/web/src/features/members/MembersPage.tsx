import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MembersView } from '@repo/ui';
import type { TravelMember, MemberSpending } from '@repo/api-client';

import { useTravelContext } from '@/contexts/TravelContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useAddMember } from '@/hooks/useAddMember';
import { useRemoveMember } from '@/hooks/useRemoveMember';
import { showToast } from '@/lib/toast';

export function MembersPage() {
  const { t, i18n } = useTranslation();
  const { travel, isOwner } = useTravelContext();
  const locale = i18n.language;

  const { data: dashboard } = useDashboard(travel.id);
  const addMember = useAddMember(travel.id);
  const removeMember = useRemoveMember(travel.id);

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
            showToast(t('member.added'), 'success');
            setShowInviteForm(false);
          },
        },
      );
    },
    [addMember, t],
  );

  const handleAddGuest = useCallback(
    (guestName: string) => {
      addMember.mutate(
        { guestName },
        {
          onSuccess: () => {
            showToast(t('member.added'), 'success');
            setShowInviteForm(false);
          },
        },
      );
    },
    [addMember, t],
  );

  const handleConfirmRemove = useCallback(() => {
    if (!memberToRemove) return;
    removeMember.mutate(memberToRemove.id, {
      onSuccess: () => {
        showToast(t('member.removed'), 'success');
        setMemberToRemove(null);
      },
    });
  }, [memberToRemove, removeMember, t]);

  return (
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
    />
  );
}
