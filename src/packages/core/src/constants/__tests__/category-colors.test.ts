import { describe, it, expect } from 'vitest';

import { createCategorySchema } from '../../schemas/category';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../category-colors';

describe('CATEGORY_COLORS', () => {
  it('has between 12 and 16 colors', () => {
    expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(12);
    expect(CATEGORY_COLORS.length).toBeLessThanOrEqual(16);
  });

  it('has no duplicate hex values', () => {
    const hexes = CATEGORY_COLORS.map((c) => c.hex);
    const unique = new Set(hexes);
    expect(unique.size).toBe(hexes.length);
  });

  it('every hex matches /^#[0-9A-Fa-f]{6}$/', () => {
    for (const color of CATEGORY_COLORS) {
      expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('every color has a non-empty name', () => {
    for (const color of CATEGORY_COLORS) {
      expect(color.name).toBeTruthy();
      expect(typeof color.name).toBe('string');
    }
  });

  it('every color passes createCategorySchema color validation', () => {
    for (const color of CATEGORY_COLORS) {
      const result = createCategorySchema.shape.color.safeParse(color.hex);
      expect(result.success, `Color "${color.name}" (${color.hex}) failed validation`).toBe(true);
    }
  });

  it('DEFAULT_CATEGORY_COLOR is the first color hex', () => {
    expect(DEFAULT_CATEGORY_COLOR).toBe(CATEGORY_COLORS[0].hex);
  });
});
