import { type ReactNode } from 'react'
import { styled, Text, XStack, Spinner } from 'tamagui'

const ButtonFrame = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$brandPrimary',
  borderRadius: '$2xl',
  paddingVertical: 18,
  paddingHorizontal: '$2xl',
  minHeight: 56,
  cursor: 'pointer',
  // elevation.button shadow
  shadowColor: '$brandPrimary',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 16,

  pressStyle: {
    opacity: 0.9,
    scale: 0.98,
  },

  variants: {
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        pressStyle: {
          opacity: 0.5,
          scale: 1,
        },
      },
    },
  } as const,
})

const ButtonLabel = styled(Text, {
  fontFamily: '$heading',
  fontSize: 18,
  fontWeight: '600',
  letterSpacing: 0.18,
  color: '$white',
  textAlign: 'center',
})

interface PrimaryButtonProps {
  label: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
}

export function PrimaryButton({ label, onPress, loading, disabled, icon }: PrimaryButtonProps) {
  const isDisabled = disabled || loading

  return (
    <ButtonFrame
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      role="button"
      aria-label={label}
      aria-disabled={isDisabled}
    >
      {loading ? (
        <Spinner size="small" color="$white" />
      ) : (
        <XStack alignItems="center" gap="$sm">
          {icon}
          <ButtonLabel>{label}</ButtonLabel>
        </XStack>
      )}
    </ButtonFrame>
  )
}
