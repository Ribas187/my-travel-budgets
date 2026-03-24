import { User } from 'lucide-react';
import { styled, XStack, Text } from 'tamagui';

/**
 * Transforms a Cloudinary URL to include responsive sizing parameters.
 * Appends width/height at 2x for retina, with c_fill, f_auto, q_auto.
 */
export function getCloudinaryAvatarUrl(baseUrl: string, size: number): string {
  const retinaSize = size * 2;
  const transformation = `w_${retinaSize},h_${retinaSize},c_fill,f_auto,q_auto`;

  // Insert transformation before the last path segment (the image file)
  // Cloudinary URLs follow: https://res.cloudinary.com/{cloud}/image/upload/{existing_transforms}/{folder}/{file}
  // We insert our transform after /upload/
  const uploadIndex = baseUrl.indexOf('/upload/');
  if (uploadIndex !== -1) {
    const afterUpload = uploadIndex + '/upload/'.length;
    return `${baseUrl.slice(0, afterUpload)}${transformation}/${baseUrl.slice(afterUpload)}`;
  }

  // Fallback: return URL as-is if it doesn't match expected Cloudinary pattern
  return baseUrl;
}

const AvatarFrame = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
});

const InitialText = styled(Text, {
  fontFamily: '$heading',
  fontWeight: '700',
  color: '$white',
});

interface UserAvatarProps {
  avatarUrl: string | null;
  name: string;
  size: number;
  backgroundColor?: string;
}

export function UserAvatar({ avatarUrl, name, size, backgroundColor }: UserAvatarProps) {
  const borderRadius = size / 2;
  const initial = name ? name.charAt(0).toUpperCase() : undefined;
  const fontSize = Math.round(size * 0.4);

  if (avatarUrl) {
    const optimizedUrl = getCloudinaryAvatarUrl(avatarUrl, size);
    return (
      <AvatarFrame
        width={size}
        height={size}
        borderRadius={borderRadius}
        data-testid="user-avatar"
      >
        <img
          src={optimizedUrl}
          alt={name || 'User avatar'}
          width={size}
          height={size}
          style={{
            borderRadius,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </AvatarFrame>
    );
  }

  return (
    <AvatarFrame
      width={size}
      height={size}
      borderRadius={borderRadius}
      backgroundColor={backgroundColor || '$brandPrimary'}
      data-testid="user-avatar"
    >
      {initial ? (
        <InitialText fontSize={fontSize}>{initial}</InitialText>
      ) : (
        <User
          size={Math.round(size * 0.45)}
          color="white"
          role="img"
          aria-label="User"
        />
      )}
    </AvatarFrame>
  );
}
