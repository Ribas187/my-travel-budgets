import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View, Input } from 'tamagui';
import { Camera, Map } from 'lucide-react';
import { Heading, Body, PrimaryButton, UserAvatar, SectionCard, NavigationRowLink } from '../../atoms';
import { BackHeader, LanguageSelector } from '../../molecules';

interface ProfileViewProps {
  user: { name: string; email: string; avatarUrl: string | null };
  currentLanguage: string;
  isEditingName: boolean;
  nameValue: string;
  isSaving: boolean;
  onStartEditName: () => void;
  onNameChange: (value: string) => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
  onChangeLanguage: (lng: string) => void;
  onAvatarPress: () => void;
  onRemoveAvatar?: () => void;
  onBack: () => void;
  onMyTravels: () => void;
  onLogout: () => void;
}

const AvatarWrapper = styled(View, {
  position: 'relative' as any,
  cursor: 'pointer',
  borderRadius: 40,
  overflow: 'hidden',
});

const CameraOverlay = styled(XStack, {
  position: 'absolute' as any,
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  hoverStyle: { opacity: 1 },
});

const SectionLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '600',
  color: '$textTertiary',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
});

const NameInput = styled(Input, {
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

const LogoutButton = styled(XStack, {
  paddingVertical: '$md',
  paddingHorizontal: '$xl',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$coral500',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
});

export function ProfileView({
  user, currentLanguage, isEditingName, nameValue, isSaving,
  onStartEditName, onNameChange, onSaveName, onCancelEdit,
  onChangeLanguage, onAvatarPress, onRemoveAvatar, onBack, onMyTravels, onLogout,
}: ProfileViewProps) {
  const { t } = useTranslation();

  const languages = [
    { code: 'en', label: t('profile.languageEn') },
    { code: 'pt-BR', label: t('profile.languagePtBr') },
  ];

  return (
    <YStack flex={1} padding="$screenPaddingHorizontal" paddingTop="$2xl" gap="$xl" maxWidth={480} alignSelf="center" width="100%" data-testid="profile-page">
      <BackHeader title={t('profile.title')} onBack={onBack} accessibilityLabel={t('profile.backToApp')} />

      {/* Avatar + User Info */}
      <YStack alignItems="center" gap="$md">
        <AvatarWrapper onPress={onAvatarPress} data-testid="profile-avatar" role="button" aria-label={t('profile.changePhoto')} tabIndex={0}>
          <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size={80} />
          <CameraOverlay>
            <Camera size={24} color="white" />
          </CameraOverlay>
        </AvatarWrapper>
        <Heading level={3}>{user.name}</Heading>
        <Body size="secondary" color="$textTertiary">{user.email}</Body>
        {user.avatarUrl && onRemoveAvatar && (
          <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$coral500" cursor="pointer" onPress={onRemoveAvatar} data-testid="remove-photo-button">
            {t('profile.removePhoto')}
          </Text>
        )}
      </YStack>

      {/* Name Section */}
      <SectionCard>
        <SectionLabel>{t('profile.name')}</SectionLabel>
        {isEditingName ? (
          <YStack gap="$md">
            <NameInput value={nameValue} onChangeText={onNameChange} placeholder={t('profile.name')} placeholderTextColor="$textTertiary" data-testid="name-input" aria-label={t('profile.name')} />
            <XStack gap="$md" justifyContent="flex-end">
              <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$textTertiary" cursor="pointer" onPress={onCancelEdit} paddingVertical="$sm">
                {t('common.cancel')}
              </Text>
              <PrimaryButton label={t('common.save')} onPress={onSaveName} disabled={!nameValue.trim() || isSaving} loading={isSaving} />
            </XStack>
          </YStack>
        ) : (
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontFamily="$body" fontSize={16} color="$textPrimary">{user.name}</Text>
            <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$terracotta500" cursor="pointer" onPress={onStartEditName} data-testid="edit-name-button">
              {t('profile.editName')}
            </Text>
          </XStack>
        )}
      </SectionCard>

      {/* Language Section */}
      <SectionCard data-testid="language-section">
        <SectionLabel>{t('profile.language')}</SectionLabel>
        <LanguageSelector languages={languages} currentLanguage={currentLanguage} onSelect={onChangeLanguage} />
      </SectionCard>

      {/* My Travels */}
      <NavigationRowLink icon={<Map size={20} color="#8C8580" />} label={t('profile.myTravels')} onPress={onMyTravels} testID="my-travels-row" />

      {/* Logout */}
      <LogoutButton onPress={onLogout} data-testid="logout-button" role="button" aria-label={t('profile.logout')}>
        <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$coral500">{t('profile.logout')}</Text>
      </LogoutButton>
    </YStack>
  );
}
