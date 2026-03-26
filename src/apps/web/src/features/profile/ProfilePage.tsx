import { useState, useCallback } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ProfileView } from '@repo/ui';

import { useUserMe, useUpdateUser, useRemoveAvatar } from '@repo/api-client';

import { useAuth } from '@/providers/AuthProvider';
import { showToast } from '@/lib/toast';
import { AvatarUploadModal } from './AvatarUploadModal';

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const { logout } = useAuth();
  const { data: user } = useUserMe();
  const updateUser = useUpdateUser();
  const removeAvatar = useRemoveAvatar();

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

  const handleRemoveAvatar = useCallback(() => {
    removeAvatar.mutate(undefined, {
      onSuccess: () => {
        showToast(t('profile.removeSuccess'), 'success');
      },
    });
  }, [removeAvatar, t]);

  if (!user) return null;

  return (
    <>
      <ProfileView
        user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
        currentLanguage={i18n.language}
        isEditingName={isEditingName}
        nameValue={nameValue}
        isSaving={updateUser.isPending}
        onStartEditName={handleStartEdit}
        onNameChange={setNameValue}
        onSaveName={handleSaveName}
        onCancelEdit={handleCancelEdit}
        onChangeLanguage={handleChangeLanguage}
        onAvatarPress={() => setIsUploadModalOpen(true)}
        onRemoveAvatar={user.avatarUrl ? handleRemoveAvatar : undefined}
        onBack={handleBack}
        onMyTravels={handleMyTravels}
        onLogout={handleLogout}
      />
      <AvatarUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => setIsUploadModalOpen(false)}
      />
    </>
  );
}
