import { type ReactNode } from 'react';
import { styled, XStack, YStack, Text, View } from 'tamagui';

const CardFrame = styled(YStack, {
  borderRadius: '$2xl',
  padding: '$cardPaddingCompact',
  overflow: 'hidden',

  variants: {
    expanded: {
      false: {
        borderWidth: 1,
        borderColor: '$borderDefault',
      },
      true: {
        borderWidth: 2,
        borderColor: '$brandPrimary',
      },
    },
  } as const,

  defaultVariants: {
    expanded: false,
  },
});

const CollapsedRow = styled(XStack, {
  alignItems: 'center',
  gap: '$iconTextGap',
  minHeight: 44,
});

const IconContainer = styled(XStack, {
  width: 44,
  height: 44,
  borderRadius: '$xl',
  alignItems: 'center',
  justifyContent: 'center',
});

const NameText = styled(Text, {
  fontFamily: '$body',
  fontSize: 15,
  fontWeight: '600',
  lineHeight: 22,
  color: '$textPrimary',
  flex: 1,
});

const BudgetText = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,
  fontWeight: '500',
  lineHeight: 18,
  color: '$textTertiary',
});

const Divider = styled(View, {
  height: 1,
  backgroundColor: '$borderDefault',
  marginVertical: '$md',
});

interface CategoryEditCardProps {
  name: string;
  budgetLabel?: string;
  icon?: ReactNode;
  iconBackgroundColor?: string;
  expanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
  actions?: ReactNode;
}

export function CategoryEditCard({
  name,
  budgetLabel,
  icon,
  iconBackgroundColor,
  expanded = false,
  onToggle,
  children,
  actions,
}: CategoryEditCardProps) {
  return (
    <CardFrame expanded={expanded}>
      <CollapsedRow
        onPress={onToggle}
        cursor="pointer"
        role="button"
        aria-expanded={expanded}
        aria-label={name}
      >
        <IconContainer backgroundColor={iconBackgroundColor}>{icon}</IconContainer>
        <YStack flex={1}>
          <NameText>{name}</NameText>
          {budgetLabel && <BudgetText>{budgetLabel}</BudgetText>}
        </YStack>
      </CollapsedRow>

      {expanded && (
        <YStack>
          <Divider />
          {children}
          {actions && (
            <>
              <Divider />
              {actions}
            </>
          )}
        </YStack>
      )}
    </CardFrame>
  );
}
