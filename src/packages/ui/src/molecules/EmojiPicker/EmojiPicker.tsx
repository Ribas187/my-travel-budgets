import { styled, XStack, YStack, Text, View } from 'tamagui';
import type { EmojiGroup } from '@repo/core';

const GroupContainer = styled(YStack, {
  gap: '$xs',
  marginBottom: '$md',
});

const GroupLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 12,
  fontWeight: '500',
  color: '$textTertiary',
  marginBottom: '$xs',
});

const EmojiGrid = styled(XStack, {
  flexWrap: 'wrap',
  gap: '$xs',
});

const EmojiButton = styled(View, {
  width: 44,
  height: 44,
  borderRadius: '$lg',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderWidth: 2,
  borderColor: 'transparent',

  variants: {
    selected: {
      true: {
        backgroundColor: '$brandPrimaryLight',
        borderColor: '$brandPrimary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
});

const EmojiText = styled(Text, {
  fontSize: 22,
});

const CurrentBadge = styled(Text, {
  fontFamily: '$body',
  fontSize: 10,
  color: '$textTertiary',
  textAlign: 'center',
});

interface EmojiPickerProps {
  groups: EmojiGroup[];
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
  groupLabels: Record<string, string>;
  currentLabel?: string;
}

export function EmojiPicker({
  groups,
  selectedEmoji,
  onSelect,
  groupLabels,
  currentLabel = 'Current',
}: EmojiPickerProps) {
  const allEmojis = groups.flatMap((g) => g.emojis);
  const isInCuratedSet = allEmojis.includes(selectedEmoji);

  return (
    <YStack role="radiogroup" aria-label="Emoji picker">
      {!isInCuratedSet && (
        <GroupContainer>
          <GroupLabel>{currentLabel}</GroupLabel>
          <EmojiGrid>
            <YStack alignItems="center">
              <EmojiButton
                selected
                onPress={() => onSelect(selectedEmoji)}
                role="radio"
                aria-checked
                aria-selected
                aria-label={`Current: ${selectedEmoji}`}
                tabIndex={0}
              >
                <EmojiText>{selectedEmoji}</EmojiText>
              </EmojiButton>
              <CurrentBadge>{currentLabel}</CurrentBadge>
            </YStack>
          </EmojiGrid>
        </GroupContainer>
      )}

      {groups.map((group) => {
        const label = groupLabels[group.groupKey] || group.groupKey;

        return (
          <GroupContainer key={group.groupKey}>
            <GroupLabel>{label}</GroupLabel>
            <EmojiGrid>
              {group.emojis.map((emoji: string) => {
                const isSelected = emoji === selectedEmoji;

                return (
                  <EmojiButton
                    key={emoji}
                    selected={isSelected}
                    onPress={() => onSelect(emoji)}
                    role="radio"
                    aria-checked={isSelected}
                    aria-selected={isSelected}
                    aria-label={emoji}
                    tabIndex={0}
                  >
                    <EmojiText>{emoji}</EmojiText>
                  </EmojiButton>
                );
              })}
            </EmojiGrid>
          </GroupContainer>
        );
      })}
    </YStack>
  );
}
