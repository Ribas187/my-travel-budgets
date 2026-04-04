import { type RefObject, useCallback, useEffect, useState } from 'react';
import { styled, XStack, YStack, Text, AnimatePresence, View } from 'tamagui';

const BubbleFrame = styled(YStack, {
  backgroundColor: '$ink',
  borderRadius: '$lg',
  padding: '$md',
  gap: '$sm',
  maxWidth: 280,
  shadowColor: '$ink',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
});

const MessageText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  lineHeight: 18,
  color: '$textInverse',
});

const DismissRow = styled(XStack, {
  justifyContent: 'flex-end',
});

const GotItButton = styled(View, {
  paddingHorizontal: '$md',
  paddingVertical: '$xs',
  borderRadius: '$pill',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

const GotItText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '700',
  color: '$textInverse',
});

const AnimatedBubble = styled(View, {
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

const PositionContainer = styled(View, {
  position: 'absolute',
  zIndex: 500,
});

export interface TooltipTipProps {
  tipId: string;
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  visible?: boolean;
}

export function TooltipTip({
  tipId,
  message,
  dismissLabel,
  onDismiss,
  anchorRef,
  visible = true,
}: TooltipTipProps) {
  const [position, setPosition] = useState<{
    top?: number;
    left?: number;
  }>({});

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

  useEffect(() => {
    if (!visible || !anchorRef?.current) return;

    const measureAnchor = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      // Handle both web (HTMLElement) and native (View with measure)
      if ('getBoundingClientRect' in anchor) {
        const rect = (anchor as HTMLElement).getBoundingClientRect();
        const viewportWidth =
          typeof window !== 'undefined' ? window.innerWidth : 390;
        const viewportHeight =
          typeof window !== 'undefined' ? window.innerHeight : 0;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const tooltipWidth = 280; // matches maxWidth on BubbleFrame
        const gap = 8;
        const edgePadding = 12;

        // Center tooltip horizontally on anchor, clamp to viewport
        const anchorCenter = rect.left + rect.width / 2;
        let left = anchorCenter - tooltipWidth / 2;
        left = Math.max(edgePadding, Math.min(left, viewportWidth - tooltipWidth - edgePadding));

        // Place below if more space, otherwise above
        if (spaceBelow >= 100 || spaceBelow > spaceAbove) {
          setPosition({
            top: rect.bottom + gap,
            left,
          });
        } else {
          setPosition({
            top: rect.top - gap,
            left,
          });
        }
      }
    };

    measureAnchor();
  }, [visible, anchorRef]);

  return (
    <AnimatePresence>
      {visible && (
        <PositionContainer
          key={`tooltip-tip-${tipId}`}
          {...(position.top !== undefined && { top: position.top })}
          {...(position.left !== undefined && { left: position.left })}
        >
          <AnimatedBubble>
            <BubbleFrame
              role="status"
              aria-live="polite"
              data-testid={`tooltip-tip-${tipId}`}
            >
              <MessageText>{message}</MessageText>
              <DismissRow>
                <GotItButton
                  onPress={onDismiss}
                  accessibilityRole="button"
                  accessibilityLabel={dismissLabel}
                  tabIndex={0}
                >
                  <GotItText>{dismissLabel}</GotItText>
                </GotItButton>
              </DismissRow>
            </BubbleFrame>
          </AnimatedBubble>
        </PositionContainer>
      )}
    </AnimatePresence>
  );
}
