import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { styled, XStack, YStack, Text, View, Spinner } from 'tamagui';
import { PrimaryButton } from '@repo/ui';

import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { showToast } from '@/lib/toast';
import { getCroppedImg } from './getCroppedImg';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const Overlay = styled(View, {
  position: 'fixed' as any,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  zIndex: 9000,
  justifyContent: 'center',
  alignItems: 'center',
});

const ModalCard = styled(YStack, {
  backgroundColor: '$white',
  borderRadius: '$2xl',
  padding: '$cardPadding',
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  gap: '$lg',
});

const CropperContainer = styled(View, {
  position: 'relative' as any,
  width: '100%',
  height: 300,
  borderRadius: '$lg',
  overflow: 'hidden',
});

const LoadingOverlay = styled(View, {
  position: 'absolute' as any,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255,255,255,0.7)',
  zIndex: 10,
  justifyContent: 'center',
  alignItems: 'center',
});

export function AvatarUploadModal({ open, onClose, onSuccess }: AvatarUploadModalProps) {
  const { t } = useTranslation();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
    uploadAvatar.reset();
  }, [uploadAvatar]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset the input so re-selecting the same file still triggers onChange
      e.target.value = '';

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(t('profile.invalidFileType'));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(t('profile.fileTooLarge'));
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    },
    [t],
  );

  const onCropComplete = useCallback(
    (_croppedArea: CroppedAreaPixels, croppedAreaPx: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setError(null);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await uploadAvatar.mutateAsync(croppedBlob);
      showToast(t('profile.uploadSuccess'), 'success');
      resetState();
      onSuccess();
    } catch {
      setError(t('profile.uploadError'));
    }
  }, [imageSrc, croppedAreaPixels, uploadAvatar, t, resetState, onSuccess]);

  const openFilePicker = useCallback(() => {
    setError(null);
    fileInputRef.current?.click();
  }, []);

  if (!open) return null;

  const isUploading = uploadAvatar.isPending;

  return (
    <Overlay onPress={handleClose} data-testid="avatar-upload-overlay">
      <ModalCard onPress={(e: any) => e.stopPropagation()} data-testid="avatar-upload-modal">
        <Text fontFamily="$heading" fontSize={18} fontWeight="700" color="$textPrimary">
          {imageSrc ? t('profile.cropTitle') : t('profile.uploadPhoto')}
        </Text>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          data-testid="avatar-file-input"
        />

        {imageSrc ? (
          <CropperContainer>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
            {isUploading && (
              <LoadingOverlay data-testid="upload-loading">
                <Spinner size="large" color="$brandPrimary" />
              </LoadingOverlay>
            )}
          </CropperContainer>
        ) : (
          <YStack alignItems="center" gap="$md" paddingVertical="$xl">
            <PrimaryButton
              label={t('profile.uploadPhoto')}
              onPress={openFilePicker}
              data-testid="select-file-button"
            />
          </YStack>
        )}

        {error && (
          <Text
            fontFamily="$body"
            fontSize={14}
            color="$coral500"
            role="alert"
            data-testid="upload-error"
          >
            {error}
          </Text>
        )}

        <XStack gap="$md" justifyContent="flex-end">
          <Text
            fontFamily="$body"
            fontSize={14}
            fontWeight="600"
            color="$textTertiary"
            cursor="pointer"
            onPress={handleClose}
            paddingVertical="$sm"
            data-testid="crop-cancel-button"
          >
            {t('profile.cropCancel')}
          </Text>
          {imageSrc && (
            <PrimaryButton
              label={t('profile.cropConfirm')}
              onPress={handleConfirm}
              disabled={isUploading}
              loading={isUploading}
              data-testid="crop-confirm-button"
            />
          )}
        </XStack>
      </ModalCard>
    </Overlay>
  );
}
