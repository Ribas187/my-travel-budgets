import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { styled, XStack, YStack, Text, Input, View } from 'tamagui'
import { PrimaryButton } from '@repo/ui'

type InviteMode = 'email' | 'guest'

interface InviteMemberFormProps {
  loading: boolean
  onInviteByEmail: (email: string) => void
  onAddGuest: (guestName: string) => void
  onCancel: () => void
}

const FormInput = styled(Input, {
  fontFamily: '$body',
  fontSize: 16,
  borderWidth: 1,
  borderColor: '$borderDefault',
  borderRadius: '$lg',
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  color: '$textPrimary',
  minHeight: 48,
})

const TabButton = styled(View, {
  paddingVertical: '$sm',
  paddingHorizontal: '$lg',
  borderRadius: '$lg',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$brandPrimary',
      },
      false: {
        backgroundColor: '$parchment',
      },
    },
  } as const,
})

export function InviteMemberForm({
  loading,
  onInviteByEmail,
  onAddGuest,
  onCancel,
}: InviteMemberFormProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<InviteMode>('email')
  const [value, setValue] = useState('')

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (mode === 'email') {
      onInviteByEmail(trimmed)
    } else {
      onAddGuest(trimmed)
    }
    setValue('')
  }, [mode, value, onInviteByEmail, onAddGuest])

  return (
    <YStack gap="$md" testID="invite-member-form">
      <XStack gap="$sm">
        <TabButton
          active={mode === 'email'}
          onPress={() => { setMode('email'); setValue('') }}
          role="tab"
          aria-selected={mode === 'email'}
          testID="invite-tab-email"
        >
          <Text
            fontFamily="$body"
            fontSize={14}
            fontWeight="600"
            color={mode === 'email' ? '$white' : '$textPrimary'}
          >
            {t('member.invite')}
          </Text>
        </TabButton>
        <TabButton
          active={mode === 'guest'}
          onPress={() => { setMode('guest'); setValue('') }}
          role="tab"
          aria-selected={mode === 'guest'}
          testID="invite-tab-guest"
        >
          <Text
            fontFamily="$body"
            fontSize={14}
            fontWeight="600"
            color={mode === 'guest' ? '$white' : '$textPrimary'}
          >
            {t('member.guest')}
          </Text>
        </TabButton>
      </XStack>
      <FormInput
        value={value}
        onChangeText={setValue}
        placeholder={
          mode === 'email'
            ? t('member.emailPlaceholder')
            : t('member.guestPlaceholder')
        }
        placeholderTextColor="$textTertiary"
        keyboardType={mode === 'email' ? 'email-address' : 'default'}
        autoCapitalize={mode === 'email' ? 'none' : 'words'}
        testID="invite-member-input"
      />
      <XStack gap="$md" justifyContent="flex-end">
        <Text
          fontFamily="$body"
          fontSize={14}
          fontWeight="600"
          color="$textTertiary"
          cursor="pointer"
          onPress={onCancel}
          paddingVertical="$sm"
          testID="invite-cancel-button"
        >
          {t('common.cancel')}
        </Text>
        <PrimaryButton
          label={t('member.add')}
          onPress={handleSubmit}
          disabled={!value.trim() || loading}
          loading={loading}
        />
      </XStack>
    </YStack>
  )
}
