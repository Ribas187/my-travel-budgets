import { describe, it, expect } from 'vitest';

import { DEFAULT_CATEGORIES } from '../default-categories';
import type { DefaultCategory } from '../default-categories';

describe('DEFAULT_CATEGORIES', () => {
  it('has exactly 6 entries', () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(6);
  });

  it('every entry has a nameKey, icon, and color', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(category).toHaveProperty('nameKey');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('color');
      expect(typeof category.nameKey).toBe('string');
      expect(typeof category.icon).toBe('string');
      expect(typeof category.color).toBe('string');
    }
  });

  it('every nameKey uses the onboarding.defaultCategory.* namespace', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(category.nameKey).toMatch(/^onboarding\.defaultCategory\.\w+$/);
    }
  });

  it('every color is a valid hex color', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(category.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('every icon is a non-empty string', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(category.icon.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate nameKeys', () => {
    const keys = DEFAULT_CATEGORIES.map((c) => c.nameKey);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('includes the expected category names', () => {
    const expectedKeys = [
      'onboarding.defaultCategory.food',
      'onboarding.defaultCategory.transport',
      'onboarding.defaultCategory.accommodation',
      'onboarding.defaultCategory.activities',
      'onboarding.defaultCategory.shopping',
      'onboarding.defaultCategory.other',
    ];
    const actualKeys = DEFAULT_CATEGORIES.map((c) => c.nameKey);
    expect(actualKeys).toEqual(expectedKeys);
  });

  it('conforms to the DefaultCategory interface', () => {
    const categories: readonly DefaultCategory[] = DEFAULT_CATEGORIES;
    expect(categories).toBeDefined();
  });
});
