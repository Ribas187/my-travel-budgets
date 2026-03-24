import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { styled, XStack, YStack, Text, View, Input } from 'tamagui';
import { Camera, Map, ChevronRight } from 'lucide-react';
import { Heading, Body, PrimaryButton, BackHeader, UserAvatar } from '@repo/ui';

import { useAuth } from '@/providers/AuthProvider';
import { useUserMe } from '@/hooks/useUserMe';
import { useUpdateUser } from '@/hooks/useUpdateUser';
import { showToast } from '@/lib/toast';
import { AvatarUploadModal } from './AvatarUploadModal';

const AvatarWrapper = styled(View, {
  position: 'relative' as any,
  cursor: 'pointer',
  borderRadius: 40,
  overflow: 'hidden',
});

const CameraOverlay = styled(XStack, {
  position: 'absolute' as any,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  hoverStyle: {
    opacity: 1,
  },
});

const SectionCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  borderWidth: 1,
  borderColor: '$borderDefault',
  padding: '$lg',
  gap: '$md',
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

const LanguageOption = styled(XStack, {
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  borderRadius: '$lg',
  borderWidth: 1,
  cursor: 'pointer',
  alignItems: 'center',
  gap: '$sm',
});

const NavigationRow = styled(XStack, {
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderDefault',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  backgroundColor: '$white',
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

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const { logout } = useAuth();
  const { data: user } = useUserMe();
  const updateUser = useUpdateUser();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleStartEdit = useCallback(() => {
    setNameValue(user?.name ?? '');
    setIsEditingName(true);
  }, [user]);

  const handleSaveName = useCallback(() => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length > 100) return;
    updateUser.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          showToast(t('profile.nameSaved'), 'success');
          setIsEditingName(false);
        },
      },
    );
  }, [nameValue, updateUser, t]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingName(false);
    setNameValue('');
  }, []);

  const handleChangeLanguage = useCallback(
    (lng: string) => {
      i18n.changeLanguage(lng);
    },
    [i18n],
  );

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: '/travels' });
    }
  }, [router, navigate]);

  const handleMyTravels = useCallback(() => {
    navigate({ to: '/travels' });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    setTimeout(() => navigate({ to: '/login' }), 0);
  }, [logout, navigate]);

  const handleOpenUpload = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const handleCloseUpload = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  if (!user) return null;

  const currentLanguage = i18n.language;

  return (
    <YStack
      flex={1}
      padding="$screenPaddingHorizontal"
      paddingTop="$2xl"
      gap="$xl"
      maxWidth={480}
      alignSelf="center"
      width="100%"
      data-testid="profile-page"
    >
      {/* Back Header */}
      <BackHeader
        title={t('profile.title')}
        onBack={handleBack}
        accessibilityLabel={t('profile.backToApp')}
      />

      {/* Avatar + User Info */}
      <YStack alignItems="center" gap="$md">
        <AvatarWrapper
          onPress={handleOpenUpload}
          data-testid="profile-avatar"
          role="button"
          aria-label={t('profile.changePhoto')}
          tabIndex={0}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenUpload();
            }
          }}
        >
          <UserAvatar
            avatarUrl={user.avatarUrl}
            name={user.name}
            size={80}
          />
          <CameraOverlay>
            <Camera size={24} color="white" />
          </CameraOverlay>
        </AvatarWrapper>
        <Heading level={3}>{user.name}</Heading>
        <Body size="secondary" color="$textTertiary">
          {user.email}
        </Body>
      </YStack>

      {/* Name Section */}
      <SectionCard>
        <SectionLabel>{t('profile.name')}</SectionLabel>
        {isEditingName ? (
          <YStack gap="$md">
            <NameInput
              value={nameValue}
              onChangeText={setNameValue}
              placeholder={t('profile.name')}
              placeholderTextColor="$textTertiary"
              data-testid="name-input"
              aria-label={t('profile.name')}
            />
            <XStack gap="$md" justifyContent="flex-end">
              <Text
                fontFamily="$body"
                fontSize={14}
                fontWeight="600"
                color="$textTertiary"
                cursor="pointer"
                onPress={handleCancelEdit}
                paddingVertical="$sm"
              >
                {t('common.cancel')}
              </Text>
              <PrimaryButton
                label={t('common.save')}
                onPress={handleSaveName}
                disabled={!nameValue.trim() || updateUser.isPending}
                loading={updateUser.isPending}
              />
            </XStack>
          </YStack>
        ) : (
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontFamily="$body" fontSize={16} color="$textPrimary">
              {user.name}
            </Text>
            <Text
              fontFamily="$body"
              fontSize={14}
              fontWeight="600"
              color="$terracotta500"
              cursor="pointer"
              onPress={handleStartEdit}
              data-testid="edit-name-button"
            >
              {t('profile.editName')}
            </Text>
          </XStack>
        )}
      </SectionCard>

      {/* Language Section */}
      <SectionCard data-testid="language-section">
        <SectionLabel>{t('profile.language')}</SectionLabel>
        <YStack gap="$sm">
          <LanguageOption
            borderColor={currentLanguage === 'en' ? '$brandPrimary' : '$borderDefault'}
            backgroundColor={currentLanguage === 'en' ? '$parchment' : '$white'}
            onPress={() => handleChangeLanguage('en')}
            data-testid="language-en"
          >
            <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$textPrimary">
              {t('profile.languageEn')}
            </Text>
          </LanguageOption>
          <LanguageOption
            borderColor={currentLanguage === 'pt-BR' ? '$brandPrimary' : '$borderDefault'}
            backgroundColor={currentLanguage === 'pt-BR' ? '$parchment' : '$white'}
            onPress={() => handleChangeLanguage('pt-BR')}
            data-testid="language-pt-br"
          >
            <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$textPrimary">
              {t('profile.languagePtBr')}
            </Text>
          </LanguageOption>
        </YStack>
      </SectionCard>

      {/* My Travels Navigation */}
      <NavigationRow
        onPress={handleMyTravels}
        data-testid="my-travels-row"
        role="button"
        aria-label={t('profile.myTravels')}
        tabIndex={0}
      >
        <XStack alignItems="center" gap="$sm">
          <Map size={20} color="#8C8580" />
          <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$textPrimary">
            {t('profile.myTravels')}
          </Text>
        </XStack>
        <ChevronRight size={18} color="#8C8580" />
      </NavigationRow>

      {/* Logout */}
      <LogoutButton
        onPress={handleLogout}
        data-testid="logout-button"
        role="button"
        aria-label={t('profile.logout')}
      >
        <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$coral500">
          {t('profile.logout')}
        </Text>
      </LogoutButton>

      {/* Upload Modal */}
      <AvatarUploadModal
        open={isUploadModalOpen}
        onClose={handleCloseUpload}
        onSuccess={handleCloseUpload}
      />
    </YStack>
  );
}
