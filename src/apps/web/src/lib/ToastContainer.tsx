import { useState, useEffect } from 'react';
import { styled, YStack, XStack, Text } from 'tamagui';

import { subscribe, getToasts } from './toast';
import type { Toast } from './toast';

const ToastFrame = styled(XStack, {
  backgroundColor: '$ink',
  paddingVertical: '$md',
  paddingHorizontal: '$lg',
  borderRadius: '$xl',
  alignItems: 'center',
  gap: '$sm',
  elevation: 4,

  variants: {
    type: {
      success: {},
      error: {
        backgroundColor: '$statusDanger',
      },
    },
  } as const,
});

const ToastText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '600',
  color: '$white',
});

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>(getToasts);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <YStack
      position="absolute"
      bottom={100}
      left={0}
      right={0}
      alignItems="center"
      gap="$sm"
      zIndex={10000}
      pointerEvents="none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastFrame key={toast.id} type={toast.type} role="status">
          <ToastText>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </ToastText>
        </ToastFrame>
      ))}
    </YStack>
  );
}
