import { describe, it, expect } from 'vitest';

import { createCategorySchema } from '../../schemas/category';
import { CATEGORY_EMOJIS, DEFAULT_CATEGORY_EMOJI } from '../category-emojis';

describe('CATEGORY_EMOJIS', () => {
  const allEmojis = CATEGORY_EMOJIS.flatMap((group) => group.emojis);

  it('has between 30 and 50 total emojis', () => {
    expect(allEmojis.length).toBeGreaterThanOrEqual(30);
    expect(allEmojis.length).toBeLessThanOrEqual(50);
  });

  it('has no duplicate emojis across all groups', () => {
    const unique = new Set(allEmojis);
    expect(unique.size).toBe(allEmojis.length);
  });

  it('every group has a non-empty groupKey', () => {
    for (const group of CATEGORY_EMOJIS) {
      expect(group.groupKey).toBeTruthy();
      expect(typeof group.groupKey).toBe('string');
    }
  });

  it('every emoji passes createCategorySchema icon validation', () => {
    for (const emoji of allEmojis) {
      const result = createCategorySchema.shape.icon.safeParse(emoji);
      expect(result.success, `Emoji "${emoji}" failed validation`).toBe(true);
    }
  });

  it('DEFAULT_CATEGORY_EMOJI is the first emoji in the first group', () => {
    expect(DEFAULT_CATEGORY_EMOJI).toBe(CATEGORY_EMOJIS[0].emojis[0]);
  });
});
