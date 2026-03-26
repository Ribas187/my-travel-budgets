import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Input, styled } from 'tamagui';
import { PrimaryButton } from '../../atoms';
import { TabButtonGroup } from '../../molecules';

type InviteMode = 'email' | 'guest';

interface InviteMemberFormProps {
  loading: boolean;
  onInviteByEmail: (email: string) => void;
  onAddGuest: (guestName: string) => void;
  onCancel: () => void;
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
});

export function InviteMemberForm({ loading, onInviteByEmail, onAddGuest, onCancel }: InviteMemberFormProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<InviteMode>('email');
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (mode === 'email') {
      onInviteByEmail(trimmed);
    } else {
      onAddGuest(trimmed);
    }
    setValue('');
  }, [mode, value, onInviteByEmail, onAddGuest]);

  const tabOptions = [
    { key: 'email', label: t('member.invite') },
    { key: 'guest', label: t('member.guest') },
  ];

  return (
    <YStack gap="$md" testID="invite-member-form">
      <TabButtonGroup options={tabOptions} activeKey={mode} onSelect={(key) => { setMode(key as InviteMode); setValue(''); }} />
      <FormInput
        value={value}
        onChangeText={setValue}
        placeholder={mode === 'email' ? t('member.emailPlaceholder') : t('member.guestPlaceholder')}
        placeholderTextColor="$textTertiary"
        keyboardType={mode === 'email' ? 'email-address' : 'default'}
        autoCapitalize={mode === 'email' ? 'none' : 'words'}
        testID="invite-member-input"
        aria-label={mode === 'email' ? t('member.emailPlaceholder') : t('member.guestPlaceholder')}
      />
      <XStack gap="$md" justifyContent="flex-end">
        <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$textTertiary" cursor="pointer" onPress={onCancel} paddingVertical="$sm" testID="invite-cancel-button">
          {t('common.cancel')}
        </Text>
        <PrimaryButton label={t('member.add')} onPress={handleSubmit} disabled={!value.trim() || loading} loading={loading} />
      </XStack>
    </YStack>
  );
}
