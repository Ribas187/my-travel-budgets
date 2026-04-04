import { type ReactNode, useCallback, useEffect } from 'react';
import { styled, XStack, YStack, Text, AnimatePresence, View } from 'tamagui';

const CardFrame = styled(YStack, {
  backgroundColor: '$teal50',
  borderRadius: '$xl',
  borderWidth: 1,
  borderColor: '$borderDefault',
  padding: '$lg',
  gap: '$sm',
});

const HeaderRow = styled(XStack, {
  alignItems: 'flex-start',
  gap: '$sm',
});

const IconContainer = styled(View, {
  width: 32,
  height: 32,
  borderRadius: '$sm',
  backgroundColor: '$white',
  alignItems: 'center',
  justifyContent: 'center',
});

const MessageText = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,
  fontWeight: '500',
  lineHeight: 20,
  color: '$textPrimary',
  flex: 1,
});

const DismissButton = styled(View, {
  width: 28,
  height: 28,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$buttonBackgroundHover',
  },
});

const DismissText = styled(Text, {
  fontSize: 16,
  color: '$textTertiary',
  lineHeight: 16,
});

const CtaButton = styled(XStack, {
  alignSelf: 'flex-start',
  paddingHorizontal: '$md',
  paddingVertical: '$xs',
  borderRadius: '$pill',
  backgroundColor: '$brandPrimary',
  cursor: 'pointer',
  hoverStyle: {
    opacity: 0.9,
  },
});

const CtaText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '700',
  color: '$textInverse',
});

const AnimatedCard = styled(View, {
  animation: 'medium',
  enterStyle: {
    opacity: 0,
    y: 10,
  },
  exitStyle: {
    opacity: 0,
    y: -10,
  },
});

export interface InlineTipProps {
  tipId: string;
  message: string;
  icon?: ReactNode;
  ctaLabel?: string;
  onCtaPress?: () => void;
  onDismiss: () => void;
  visible?: boolean;
}

export function InlineTip({
  tipId,
  message,
  icon,
  ctaLabel,
  onCtaPress,
  onDismiss,
  visible = true,
}: InlineTipProps) {
  const handleKeyDown = useCallback(
    (event: { key: string }) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    },
    [onDismiss],
  );

  useEffect(() => {
    if (visible && typeof window !== 'undefined') {
      const handler = (e: KeyboardEvent) => handleKeyDown(e);
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [visible, handleKeyDown]);

  return (
    <AnimatePresence>
      {visible && (
        <AnimatedCard key={`inline-tip-${tipId}`}>
          <CardFrame
            role="status"
            aria-live="polite"
            data-testid={`inline-tip-${tipId}`}
          >
            <HeaderRow>
              {icon && (
                <IconContainer>
                  <Text fontSize={16}>{icon}</Text>
                </IconContainer>
              )}
              <MessageText>{message}</MessageText>
              <DismissButton
                onPress={onDismiss}
                accessibilityRole="button"
                accessibilityLabel="Dismiss tip"
                tabIndex={0}
              >
                <DismissText>{'\u2715'}</DismissText>
              </DismissButton>
            </HeaderRow>
            {ctaLabel && onCtaPress && (
              <CtaButton
                onPress={onCtaPress}
                accessibilityRole="button"
                tabIndex={0}
              >
                <CtaText>{ctaLabel}</CtaText>
              </CtaButton>
            )}
          </CardFrame>
        </AnimatedCard>
      )}
    </AnimatePresence>
  );
}
