import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TripFormView } from '@repo/ui';
import type { TravelDetail, CreateTravelInput } from '@repo/api-client';

import { useAddMember } from '@/hooks/useAddMember';
import { useRemoveMember } from '@/hooks/useRemoveMember';
import { showToast } from '@/lib/toast';

interface TripFormProps {
  travel?: TravelDetail;
  expenseCount?: number;
  saving: boolean;
  deleting?: boolean;
  onSave: (data: CreateTravelInput) => void;
  onDelete?: () => void;
}

export function TripForm({
  travel,
  expenseCount = 0,
  saving,
  deleting = false,
  onSave,
  onDelete,
}: TripFormProps) {
  const { t } = useTranslation();
  const [showInviteForm, setShowInviteForm] = useState(false);

  const addMember = useAddMember(travel?.id ?? '');
  const removeMember = useRemoveMember(travel?.id ?? '');

  const handleInviteByEmail = useCallback(
    (email: string) => {
      if (!addMember) return;
      addMember.mutate(
        { email },
        {
          onSuccess: () => {
            showToast(t('member.added'));
            setShowInviteForm(false);
          },
        },
      );
    },
    [addMember, t],
  );

  const handleAddGuest = useCallback(
    (guestName: string) => {
      if (!addMember) return;
      addMember.mutate(
        { guestName },
        {
          onSuccess: () => {
            showToast(t('member.added'));
            setShowInviteForm(false);
          },
        },
      );
    },
    [addMember, t],
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      if (!removeMember) return;
      removeMember.mutate(memberId, {
        onSuccess: () => {
          showToast(t('member.removed'));
        },
      });
    },
    [removeMember, t],
  );

  return (
    <TripFormView
      travel={travel}
      expenseCount={expenseCount}
      saving={saving}
      deleting={deleting}
      onSave={onSave}
      onDelete={onDelete}
      showInviteForm={showInviteForm}
      inviteLoading={addMember?.isPending ?? false}
      onShowInviteForm={() => setShowInviteForm(true)}
      onInviteByEmail={handleInviteByEmail}
      onAddGuest={handleAddGuest}
      onCancelInvite={() => setShowInviteForm(false)}
      onRemoveMember={handleRemoveMember}
    />
  );
}
