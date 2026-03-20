import { type ComponentProps, type ElementType } from 'react'
import { styled, Text } from 'tamagui'

// ---------------------------------------------------------------------------
// Heading — uses Fredoka font family (display/headings)
// Values from design-tokens.json → typography.scale
// Renders as the correct semantic HTML heading element (h1–h4)
// ---------------------------------------------------------------------------

const HeadingBase = styled(Text, {
  fontFamily: '$heading',
  color: '$textPrimary',

  variants: {
    level: {
      heroAmount: {
        fontSize: 56,
        fontWeight: '700',
        letterSpacing: -1.68,
      },
      displayLarge: {
        fontSize: 36,
        fontWeight: '700',
        letterSpacing: -0.72,
      },
      displayMedium: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.64,
      },
      1: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.56,
      },
      2: {
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: -0.48,
      },
      3: {
        fontSize: 22,
        fontWeight: '600',
        letterSpacing: -0.44,
      },
      4: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0,
      },
      statLarge: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 0,
      },
      statPercentage: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0,
      },
    },
  } as const,

  defaultVariants: {
    level: 1,
  },
})

type HeadingBaseProps = ComponentProps<typeof HeadingBase>

const LEVEL_TAG_MAP: Record<string, ElementType> = {
  '1': 'h1',
  '2': 'h2',
  '3': 'h3',
  '4': 'h4',
}

export function Heading({ level = 1, ...props }: HeadingBaseProps) {
  const tag = LEVEL_TAG_MAP[String(level)] ?? 'span'
  return <HeadingBase level={level} tag={tag} {...props} />
}

// ---------------------------------------------------------------------------
// Body — uses Nunito font family
// ---------------------------------------------------------------------------

export const Body = styled(Text, {
  fontFamily: '$body',
  color: '$textPrimary',

  variants: {
    size: {
      large: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
      },
      default: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '600',
      },
      secondary: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
      },
    },
  } as const,

  defaultVariants: {
    size: 'default',
  },
})

// ---------------------------------------------------------------------------
// Caption — uses Nunito font family
// ---------------------------------------------------------------------------

export const Caption = styled(Text, {
  fontFamily: '$body',
  color: '$textSecondary',

  variants: {
    strong: {
      true: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
      },
      false: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
      },
    },
  } as const,

  defaultVariants: {
    strong: false,
  },
})

// ---------------------------------------------------------------------------
// Label — uses Nunito font family
// ---------------------------------------------------------------------------

export const Label = styled(Text, {
  fontFamily: '$body',
  color: '$textPrimary',
  fontSize: 13,
  lineHeight: 18,
  fontWeight: '600',
  letterSpacing: 0.26,
})
