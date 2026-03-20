import { createFont, createTamagui, createTokens } from 'tamagui'

// ---------------------------------------------------------------------------
// Fonts (from design-tokens.json → typography)
// ---------------------------------------------------------------------------

const fredokaFont = createFont({
  family: 'Fredoka, sans-serif',
  size: {
    heroAmount: 56,
    displayLarge: 36,
    displayMedium: 32,
    heading1: 28,
    heading2: 24,
    heading3: 22,
    heading4: 18,
    statLarge: 22,
    statPercentage: 20,
    avatarInitial: 14,
    buttonPrimary: 18,
  },
  weight: {
    heroAmount: '700',
    displayLarge: '700',
    displayMedium: '700',
    heading1: '700',
    heading2: '600',
    heading3: '600',
    heading4: '600',
    statLarge: '700',
    statPercentage: '700',
    avatarInitial: '600',
    buttonPrimary: '600',
  },
  letterSpacing: {
    heroAmount: -0.03 * 56,
    displayLarge: -0.02 * 36,
    displayMedium: -0.02 * 32,
    heading1: -0.02 * 28,
    heading2: -0.02 * 24,
    heading3: -0.02 * 22,
    heading4: 0,
    statLarge: 0,
    statPercentage: 0,
    avatarInitial: 0,
    buttonPrimary: 0.01 * 18,
  },
})

const nunitoFont = createFont({
  family: 'Nunito, sans-serif',
  size: {
    bodyLarge: 16,
    bodyDefault: 15,
    bodySecondary: 14,
    caption: 13,
    captionStrong: 13,
    overline: 13,
    label: 13,
    small: 12,
    tabLabel: 11,
    tabLabelActive: 11,
    buttonSecondary: 15,
    amountDisplay: 16,
  },
  lineHeight: {
    bodyLarge: 24,
    bodyDefault: 22,
    bodySecondary: 20,
    caption: 18,
    captionStrong: 18,
    overline: 18,
    label: 18,
    small: 16,
    tabLabel: 14,
    tabLabelActive: 14,
    buttonSecondary: 22,
    amountDisplay: 22,
  },
  weight: {
    bodyLarge: '500',
    bodyDefault: '600',
    bodySecondary: '500',
    caption: '500',
    captionStrong: '700',
    overline: '500',
    label: '600',
    small: '600',
    tabLabel: '600',
    tabLabelActive: '700',
    buttonSecondary: '700',
    amountDisplay: '700',
  },
  letterSpacing: {
    bodyLarge: 0,
    bodyDefault: 0,
    bodySecondary: 0,
    caption: 0,
    captionStrong: 0,
    overline: 0.04 * 13,
    label: 0.02 * 13,
    small: 0,
    tabLabel: 0,
    tabLabelActive: 0,
    buttonSecondary: 0,
    amountDisplay: 0,
  },
})

// ---------------------------------------------------------------------------
// Tokens (from design-tokens.json)
// ---------------------------------------------------------------------------

export const tokens = createTokens({
  color: {
    // Primitive palette
    warmWhite: '#FAF8F5',
    parchment: '#F5F2EE',
    sand: '#F0EDE8',
    stone: '#D4CFC8',
    muted: '#8C8580',
    secondary: '#5C5650',
    ink: '#1A1815',
    white: '#FFFFFF',
    teal50: '#F0FDFA',
    teal500: '#0D9488',
    amber50: '#FEF3C7',
    amber500: '#F59E0B',
    amber900: '#92400E',
    coral500: '#EF4444',
    terracotta500: '#C2410C',
    terracotta600: '#E8590C',
    blue50: '#DBEAFE',
    blue500: '#3B82F6',
    pink50: '#FCE7F3',
    pink500: '#EC4899',
    violet50: '#EDE9FE',
    violet500: '#8B5CF6',

    // Semantic – background
    backgroundPrimary: '#FAF8F5',
    backgroundSecondary: '#F5F2EE',
    backgroundCard: '#FFFFFF',
    backgroundElevated: '#FFFFFF',

    // Semantic – text
    textPrimary: '#1A1815',
    textSecondary: '#5C5650',
    textTertiary: '#8C8580',
    textDisabled: '#D4CFC8',
    textInverse: '#FFFFFF',

    // Semantic – border
    borderDefault: 'rgba(26, 24, 21, 0.06)',
    borderSubtle: 'rgba(26, 24, 21, 0.08)',
    borderEmphasis: 'rgba(26, 24, 21, 0.1)',
    borderStrong: 'rgba(26, 24, 21, 0.12)',

    // Semantic – brand
    brandPrimary: '#C2410C',
    brandPrimaryGradientStart: '#C2410C',
    brandPrimaryGradientEnd: '#E8590C',
    brandAccent: '#F59E0B',

    // Semantic – status
    statusSafe: '#0D9488',
    statusSafeBackground: '#F0FDFA',
    statusWarning: '#F59E0B',
    statusWarningBackground: '#FEF3C7',
    statusWarningText: '#92400E',
    statusDanger: '#EF4444',
    statusDangerBackground: 'rgba(239, 68, 68, 0.04)',

    // Semantic – category
    categoryFoodIcon: '#F59E0B',
    categoryFoodBackground: '#FEF3C7',
    categoryTransportIcon: '#3B82F6',
    categoryTransportBackground: '#DBEAFE',
    categoryActivitiesIcon: '#EC4899',
    categoryActivitiesBackground: '#FCE7F3',
    categoryLodgingIcon: '#8B5CF6',
    categoryLodgingBackground: '#EDE9FE',
    categoryShoppingIcon: '#0D9488',
    categoryShoppingBackground: '#F0FDFA',

    // Semantic – interactive
    buttonBackground: 'rgba(26, 24, 21, 0.06)',
    buttonBackgroundHover: 'rgba(26, 24, 21, 0.1)',
    inputBackground: '#F5F2EE',
    chipDefault: '#FFFFFF',
    chipActive: '#1A1815',
    chipActiveText: '#FAF8F5',

    // Transparent (utility)
    transparent: 'transparent',
  },

  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,

    // Layout tokens
    screenPaddingHorizontal: 24,
    cardPadding: 24,
    cardPaddingCompact: 16,
    sectionGap: 24,
    listItemPaddingVertical: 12,
    listItemPaddingHorizontal: 24,
    chipGap: 10,
    iconTextGap: 12,
    statusBarPadding: 12,
  },

  size: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },

  radius: {
    xs: 3,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14,
    '2xl': 16,
    '3xl': 20,
    pill: 20,
    full: 9999,
  },

  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

const lightTheme = {
  background: tokens.color.backgroundPrimary,
  backgroundHover: tokens.color.backgroundSecondary,
  backgroundPress: tokens.color.sand,
  backgroundFocus: tokens.color.backgroundSecondary,
  backgroundStrong: tokens.color.parchment,
  backgroundTransparent: tokens.color.transparent,

  color: tokens.color.textPrimary,
  colorHover: tokens.color.textPrimary,
  colorPress: tokens.color.textPrimary,
  colorFocus: tokens.color.textPrimary,
  colorTransparent: tokens.color.transparent,

  borderColor: tokens.color.borderDefault,
  borderColorHover: tokens.color.borderEmphasis,
  borderColorPress: tokens.color.borderStrong,
  borderColorFocus: tokens.color.borderEmphasis,

  placeholderColor: tokens.color.textTertiary,
  outlineColor: tokens.color.brandPrimary,

  // Semantic aliases
  primary: tokens.color.brandPrimary,
  primaryGradientStart: tokens.color.brandPrimaryGradientStart,
  primaryGradientEnd: tokens.color.brandPrimaryGradientEnd,
  accent: tokens.color.brandAccent,

  textPrimary: tokens.color.textPrimary,
  textSecondary: tokens.color.textSecondary,
  textTertiary: tokens.color.textTertiary,
  textDisabled: tokens.color.textDisabled,
  textInverse: tokens.color.textInverse,

  backgroundCard: tokens.color.backgroundCard,
  backgroundElevated: tokens.color.backgroundElevated,
  backgroundInput: tokens.color.inputBackground,

  safe: tokens.color.statusSafe,
  safeBackground: tokens.color.statusSafeBackground,
  warning: tokens.color.statusWarning,
  warningBackground: tokens.color.statusWarningBackground,
  warningText: tokens.color.statusWarningText,
  danger: tokens.color.statusDanger,
  dangerBackground: tokens.color.statusDangerBackground,

  chipDefault: tokens.color.chipDefault,
  chipActive: tokens.color.chipActive,
  chipActiveText: tokens.color.chipActiveText,
}

// ---------------------------------------------------------------------------
// Media queries (from design-tokens.json → breakpoints)
// ---------------------------------------------------------------------------

const media = {
  mobile: { maxWidth: 767 },
  tablet: { minWidth: 768, maxWidth: 1023 },
  desktop: { minWidth: 1024 },
  wide: { minWidth: 1440 },
  gtMobile: { minWidth: 768 },
  gtTablet: { minWidth: 1024 },
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const config = createTamagui({
  defaultFont: 'body',
  fonts: {
    heading: fredokaFont,
    body: nunitoFont,
  },
  tokens,
  themes: {
    light: lightTheme,
  },
  media,
})

export default config

type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
