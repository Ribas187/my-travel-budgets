import { styled, XStack, Text } from 'tamagui'

const ChipFrame = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 8,
  paddingHorizontal: '$lg',
  borderRadius: '$pill',
  cursor: 'pointer',
  minHeight: 44,

  variants: {
    active: {
      false: {
        backgroundColor: '$white',
        borderWidth: 1,
        borderColor: '$borderEmphasis',
      },
      true: {
        backgroundColor: '$chipActive',
        borderWidth: 1,
        borderColor: '$chipActive',
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
})

const ChipLabel = styled(Text, {
  fontFamily: '$body',
  fontSize: 13,

  variants: {
    active: {
      false: {
        color: '$textSecondary',
      },
      true: {
        color: '$chipActiveText',
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
})

interface FilterChipProps {
  label: string
  active?: boolean
  onPress?: () => void
}

export function FilterChip({ label, active = false, onPress }: FilterChipProps) {
  return (
    <ChipFrame
      active={active}
      onPress={onPress}
      role="radio"
      aria-checked={active}
      aria-label={label}
    >
      <ChipLabel active={active}>{label}</ChipLabel>
    </ChipFrame>
  )
}
