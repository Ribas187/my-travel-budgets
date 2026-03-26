import { describe, it, expect } from 'vitest';

import { config, tokens } from '../tamagui.config';

describe('Tamagui Config', () => {
  it('exports a valid Tamagui configuration', () => {
    expect(config).toBeDefined();
    expect(config.fonts).toBeDefined();
    expect(config.themes).toBeDefined();
  });

  describe('color tokens', () => {
    it('contains all primitive color tokens', () => {
      const colorKeys = Object.keys(tokens.color);
      const expectedPrimitives = [
        'warmWhite',
        'parchment',
        'sand',
        'stone',
        'muted',
        'secondary',
        'ink',
        'white',
        'teal50',
        'teal500',
        'amber50',
        'amber500',
        'amber900',
        'coral500',
        'terracotta500',
        'terracotta600',
        'blue50',
        'blue500',
        'pink50',
        'pink500',
        'violet50',
        'violet500',
      ];
      for (const key of expectedPrimitives) {
        expect(colorKeys).toContain(key);
      }
    });

    it('contains semantic color tokens', () => {
      const colorKeys = Object.keys(tokens.color);
      const expectedSemantic = [
        'backgroundPrimary',
        'backgroundSecondary',
        'backgroundCard',
        'backgroundElevated',
        'textPrimary',
        'textSecondary',
        'textTertiary',
        'textDisabled',
        'textInverse',
        'borderDefault',
        'brandPrimary',
        'brandAccent',
        'statusSafe',
        'statusWarning',
        'statusDanger',
      ];
      for (const key of expectedSemantic) {
        expect(colorKeys).toContain(key);
      }
    });

    it('has correct brand primary color (terracotta)', () => {
      expect(tokens.color.brandPrimary.val).toBe('#C2410C');
    });

    it('has correct brand accent color (amber)', () => {
      expect(tokens.color.brandAccent.val).toBe('#F59E0B');
    });
  });

  describe('spacing tokens', () => {
    it('contains all spacing scale values', () => {
      const spaceKeys = Object.keys(tokens.space);
      const expected = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
      for (const key of expected) {
        expect(spaceKeys).toContain(key);
      }
    });

    it('has correct spacing values', () => {
      expect(tokens.space.xs.val).toBe(4);
      expect(tokens.space.sm.val).toBe(8);
      expect(tokens.space.md.val).toBe(12);
      expect(tokens.space.lg.val).toBe(16);
      expect(tokens.space['3xl'].val).toBe(32);
    });

    it('contains layout spacing tokens', () => {
      const spaceKeys = Object.keys(tokens.space);
      expect(spaceKeys).toContain('screenPaddingHorizontal');
      expect(spaceKeys).toContain('cardPadding');
      expect(spaceKeys).toContain('chipGap');
    });
  });

  describe('radius tokens', () => {
    it('contains all radius values', () => {
      const radiusKeys = Object.keys(tokens.radius);
      const expected = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'pill', 'full'];
      for (const key of expected) {
        expect(radiusKeys).toContain(key);
      }
    });

    it('has correct radius values', () => {
      expect(tokens.radius.xs.val).toBe(3);
      expect(tokens.radius.sm.val).toBe(8);
      expect(tokens.radius.full.val).toBe(9999);
    });
  });

  describe('fonts', () => {
    it('defines heading font (Fredoka)', () => {
      expect(config.fonts.heading.family).toContain('Fredoka');
    });

    it('defines body font (Nunito)', () => {
      expect(config.fonts.body.family).toContain('Nunito');
    });
  });

  describe('light theme', () => {
    const lightTheme = config.themes.light;

    it('contains required semantic color keys', () => {
      const themeKeys = Object.keys(lightTheme);
      const required = [
        'background',
        'color',
        'borderColor',
        'primary',
        'accent',
        'textPrimary',
        'textSecondary',
        'textTertiary',
        'textDisabled',
        'textInverse',
        'backgroundCard',
        'backgroundElevated',
        'safe',
        'safeBackground',
        'warning',
        'warningBackground',
        'warningText',
        'danger',
        'dangerBackground',
      ];
      for (const key of required) {
        expect(themeKeys, `Missing theme key: ${key}`).toContain(key);
      }
    });

    it('maps primary to terracotta brand color', () => {
      expect(lightTheme.primary.val).toBe('#C2410C');
    });

    it('maps safe to teal status color', () => {
      expect(lightTheme.safe.val).toBe('#0D9488');
    });

    it('maps warning to amber status color', () => {
      expect(lightTheme.warning.val).toBe('#F59E0B');
    });

    it('maps danger to coral red status color', () => {
      expect(lightTheme.danger.val).toBe('#EF4444');
    });
  });
});
