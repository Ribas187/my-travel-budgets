import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { XStack, YStack, Text, View } from 'tamagui'
import { AvatarChip, Heading, PrimaryButton } from '@repo/ui'
import type { TravelMember, MemberSpending } from '@repo/api-client'
import { useTravelContext } from '@/contexts/TravelContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useAddMember } from '@/hooks/useAddMember'
import { useRemoveMember } from '@/hooks/useRemoveMember'
import { InviteMemberForm } from '@/features/travels/InviteMemberForm'
import { showToast } from '@/lib/toast'

const AVATAR_COLORS = [
  '#FF6B35', '#0EA5E9', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F59E0B', '#EF4444', '#6366F1',
]

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getMemberDisplayName(member: TravelMember): string {
  return member.user?.name ?? member.guestName ?? member.user?.email ?? ''
}

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

// --- Confirmation Dialog ---

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  t,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  t: (key: string) => string
}) {
  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.4)"
      alignItems="center"
      justifyContent="center"
      zIndex={100}
      data-testid="confirm-dialog"
    >
      <YStack
        backgroundColor="$white"
        borderRadius="$2xl"
        padding="$xl"
        gap="$lg"
        maxWidth={400}
        width="90%"
      >
        <Text fontFamily="$body" fontSize={16} fontWeight="600" color="$textPrimary">
          {message}
        </Text>
        <XStack gap="$md" justifyContent="flex-end">
          <Text
            fontFamily="$body"
            fontSize={14}
            fontWeight="600"
            color="$textTertiary"
            cursor="pointer"
            onPress={onCancel}
            paddingVertical="$sm"
            data-testid="confirm-cancel"
          >
            {t('common.cancel')}
          </Text>
          <YStack
            backgroundColor="$coral500"
            paddingHorizontal="$lg"
            paddingVertical="$sm"
            borderRadius="$lg"
            cursor="pointer"
            onPress={onConfirm}
            data-testid="confirm-remove"
          >
            <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$white">
              {t('member.remove')}
            </Text>
          </YStack>
        </XStack>
      </YStack>
    </YStack>
  )
}

// --- Member Row ---

function MemberRow({
  member,
  index,
  spending,
  currency,
  locale,
  isOwner,
  isCurrentUserOwner,
  onRemove,
  t,
}: {
  member: TravelMember
  index: number
  spending?: MemberSpending
  currency: string
  locale: string
  isOwner: boolean
  isCurrentUserOwner: boolean
  onRemove: () => void
  t: (key: string) => string
}) {
  const displayName = getMemberDisplayName(member)
  const initial = displayName.charAt(0).toUpperCase()
  const roleBadge = member.role === 'owner' ? t('member.owner') : t('member.member')
  const canRemove = isCurrentUserOwner && !isOwner

  return (
    <XStack
      alignItems="center"
      paddingVertical="$md"
      gap="$md"
      data-testid="member-row"
    >
      <XStack flex={1} alignItems="center" gap="$md">
        <AvatarChip
          name={displayName}
          initial={initial}
          avatarColor={getAvatarColor(index)}
          role={roleBadge}
        />
      </XStack>

      <YStack alignItems="flex-end" gap={2}>
        {spending && (
          <Text fontFamily="$body" fontSize={15} fontWeight="700" color="$textPrimary">
            {formatCurrency(spending.totalSpent, currency, locale)}
          </Text>
        )}
      </YStack>

      {canRemove && (
        <Text
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
          color="$coral500"
          cursor="pointer"
          onPress={onRemove}
          paddingVertical="$xs"
          paddingHorizontal="$sm"
          data-testid="remove-member-button"
        >
          {t('member.remove')}
        </Text>
      )}
    </XStack>
  )
}

// --- Main Component ---

export function MembersPage() {
  const { t, i18n } = useTranslation()
  const { travel, isOwner, currentUserId } = useTravelContext()
  const locale = i18n.language

  const { data: dashboard } = useDashboard(travel.id)
  const addMember = useAddMember(travel.id)
  const removeMember = useRemoveMember(travel.id)

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TravelMember | null>(null)

  const memberSpendingMap = useMemo(() => {
    if (!dashboard) return new Map<string, MemberSpending>()
    const map = new Map<string, MemberSpending>()
    for (const ms of dashboard.memberSpending) {
      map.set(ms.memberId, ms)
    }
    return map
  }, [dashboard])

  const handleInviteByEmail = useCallback(
    (email: string) => {
      addMember.mutate(
        { email },
        {
          onSuccess: () => {
            showToast(t('member.added'), 'success')
            setShowInviteForm(false)
          },
        },
      )
    },
    [addMember, t],
  )

  const handleAddGuest = useCallback(
    (guestName: string) => {
      addMember.mutate(
        { guestName },
        {
          onSuccess: () => {
            showToast(t('member.added'), 'success')
            setShowInviteForm(false)
          },
        },
      )
    },
    [addMember, t],
  )

  const handleConfirmRemove = useCallback(() => {
    if (!memberToRemove) return
    removeMember.mutate(memberToRemove.id, {
      onSuccess: () => {
        showToast(t('member.removed'), 'success')
        setMemberToRemove(null)
      },
    })
  }, [memberToRemove, removeMember, t])

  return (
    <YStack
      flex={1}
      padding="$screenPaddingHorizontal"
      paddingTop="$2xl"
      gap="$lg"
      data-testid="members-page"
    >
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <Heading level={2}>{t('member.title')}</Heading>
        {isOwner && !showInviteForm && (
          <PrimaryButton
            label={t('member.add')}
            onPress={() => setShowInviteForm(true)}
            data-testid="invite-button"
          />
        )}
      </XStack>

      {/* Invite Form */}
      {showInviteForm && (
        <InviteMemberForm
          loading={addMember.isPending}
          onInviteByEmail={handleInviteByEmail}
          onAddGuest={handleAddGuest}
          onCancel={() => setShowInviteForm(false)}
        />
      )}

      {/* Member List */}
      <YStack data-testid="member-list">
        {travel.members.map((member, index) => {
          const isMemberOwner = member.role === 'owner'
          return (
            <MemberRow
              key={member.id}
              member={member}
              index={index}
              spending={memberSpendingMap.get(member.id)}
              currency={travel.currency}
              locale={locale}
              isOwner={isMemberOwner}
              isCurrentUserOwner={isOwner}
              onRemove={() => setMemberToRemove(member)}
              t={t}
            />
          )
        })}
      </YStack>

      {/* Confirmation Dialog */}
      {memberToRemove && (
        <ConfirmDialog
          message={t('member.removeConfirm', { name: getMemberDisplayName(memberToRemove) })}
          onConfirm={handleConfirmRemove}
          onCancel={() => setMemberToRemove(null)}
          t={t}
        />
      )}
    </YStack>
  )
}
