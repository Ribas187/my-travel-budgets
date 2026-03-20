import { type ReactNode } from 'react'
import { styled, XStack, Text } from 'tamagui'

const ChipFrame = styled(XStack, {
  alignItems: 'center',
  gap: '$sm',
  paddingVertical: 10,
  paddingHorizontal: '$lg',
  borderRadius: '$lg',
  cursor: 'pointer',
  minHeight: 44,

  variants: {
    selected: {
      false: {
        backgroundColor: '$white',
        borderWidth: 1,
        borderColor: '$borderEmphasis',
      },
      true: {
        borderWidth: 2,
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const ChipLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 14,

  variants: {
    selected: {
      false: {
        color: '$textSecondary',
        fontWeight: '600',
      },
      true: {
        fontWeight: '700',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

interface CategoryChipProps {
  label: string
  icon?: ReactNode
  selected?: boolean
  selectedBackgroundColor?: string
  selectedBorderColor?: string
  selectedTextColor?: string
  onPress?: () => void
}

export function CategoryChip({
  label,
  icon,
  selected = false,
  selectedBackgroundColor,
  selectedBorderColor,
  selectedTextColor,
  onPress,
}: CategoryChipProps) {
  return (
    <ChipFrame
      selected={selected}
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      {...(selected && {
        backgroundColor: selectedBackgroundColor,
        borderColor: selectedBorderColor,
      })}
    >
      {icon}
      <ChipLabel
        selected={selected}
        {...(selected && selectedTextColor && { color: selectedTextColor })}
      >
        {label}
      </ChipLabel>
    </ChipFrame>
  )
}
