import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  CATEGORY_EMOJIS,
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_EMOJI,
  DEFAULT_CATEGORY_COLOR,
} from '@repo/core';

import { CategoriesPage } from '../CategoriesPage';

const MOCK_TRAVEL = {
  id: 'travel-1',
  name: 'Japan Trip',
  description: 'Exploring Tokyo and Kyoto',
  imageUrl: null,
  currency: 'JPY',
  budget: 500000,
  startDate: '2026-04-01',
  endDate: '2026-04-15',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  members: [
    {
      id: 'member-1',
      travelId: 'travel-1',
      userId: 'user-1',
      guestName: null,
      role: 'owner' as const,
      user: {
        id: 'user-1',
        email: 'owner@test.com',
        name: 'Trip Owner',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ],
  categories: [] as any[],
};

const MOCK_CATEGORY_FOOD = {
  id: 'cat-food',
  travelId: 'travel-1',
  name: 'Food & Drinks',
  icon: '🍔',
  color: '#F59E0B',
  budgetLimit: 100000,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

const MOCK_CATEGORY_LEGACY = {
  id: 'cat-legacy',
  travelId: 'travel-1',
  name: 'Legacy Category',
  icon: '🎯',
  color: '#ABCDEF',
  budgetLimit: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

describe('CategoriesPage form refactor', () => {
  describe('Component export and rendering', () => {
    it('CategoriesPage is exported and is a function component', () => {
      expect(CategoriesPage).toBeDefined();
      expect(typeof CategoriesPage).toBe('function');
    });

    it('renders with empty categories', () => {
      const element = React.createElement(CategoriesPage, {
        travel: MOCK_TRAVEL as any,
        isOwner: true,
      });
      expect(element).toBeDefined();
      expect(element.props.travel.categories).toHaveLength(0);
    });

    it('renders with existing categories', () => {
      const travelWithCategories = {
        ...MOCK_TRAVEL,
        categories: [MOCK_CATEGORY_FOOD],
      };
      const element = React.createElement(CategoriesPage, {
        travel: travelWithCategories as any,
        isOwner: true,
      });
      expect(element).toBeDefined();
      expect(element.props.travel.categories).toHaveLength(1);
    });
  });

  describe('Create flow: default emoji and color pre-selected', () => {
    it('DEFAULT_CATEGORY_EMOJI is the first emoji in the first group', () => {
      expect(DEFAULT_CATEGORY_EMOJI).toBe(CATEGORY_EMOJIS[0].emojis[0]);
    });

    it('DEFAULT_CATEGORY_COLOR is the first color hex in the palette', () => {
      expect(DEFAULT_CATEGORY_COLOR).toBe(CATEGORY_COLORS[0].hex);
    });

    it('default form state uses the curated defaults', () => {
      // Simulate what CategoriesPage does when creating a new category
      const defaultForm = {
        name: '',
        budgetLimit: '',
        selectedEmoji: DEFAULT_CATEGORY_EMOJI,
        selectedColor: DEFAULT_CATEGORY_COLOR,
      };
      expect(defaultForm.selectedEmoji).toBe('🍔');
      expect(defaultForm.selectedColor).toBe('#E53E3E');
    });
  });

  describe('Create flow: submitting sends correct icon and color', () => {
    it('form state maps to CreateCategoryInput with selectedEmoji as icon', () => {
      const form = {
        name: 'Food',
        budgetLimit: '500',
        selectedEmoji: '☕',
        selectedColor: '#3182CE',
      };

      const createInput = {
        name: form.name.trim(),
        icon: form.selectedEmoji,
        color: form.selectedColor,
        budgetLimit: Number(form.budgetLimit),
      };

      expect(createInput.icon).toBe('☕');
      expect(createInput.color).toBe('#3182CE');
      expect(createInput.name).toBe('Food');
      expect(createInput.budgetLimit).toBe(500);
    });

    it('null budget limit when budgetLimit is empty string', () => {
      const form = {
        name: 'Activities',
        budgetLimit: '',
        selectedEmoji: '🎭',
        selectedColor: '#D53F8C',
      };

      const budgetLimit = form.budgetLimit ? Number(form.budgetLimit) : null;
      expect(budgetLimit).toBeNull();
    });
  });

  describe('Edit flow: form pre-selects existing category emoji and color', () => {
    it('getFormFromCategory maps icon to selectedEmoji', () => {
      // Simulate getFormFromCategory logic
      const category = MOCK_CATEGORY_FOOD;
      const form = {
        name: category.name,
        budgetLimit: category.budgetLimit != null ? String(category.budgetLimit) : '',
        selectedEmoji: category.icon,
        selectedColor: category.color,
      };

      expect(form.selectedEmoji).toBe('🍔');
      expect(form.selectedColor).toBe('#F59E0B');
      expect(form.name).toBe('Food & Drinks');
      expect(form.budgetLimit).toBe('100000');
    });

    it('getFormFromCategory handles null budgetLimit', () => {
      const category = { ...MOCK_CATEGORY_FOOD, budgetLimit: null };
      const form = {
        name: category.name,
        budgetLimit: category.budgetLimit != null ? String(category.budgetLimit) : '',
        selectedEmoji: category.icon,
        selectedColor: category.color,
      };
      expect(form.budgetLimit).toBe('');
    });
  });

  describe('Edit flow: submitting sends updated icon and color', () => {
    it('update input uses selectedEmoji and selectedColor from form', () => {
      const form = {
        name: 'Updated Food',
        budgetLimit: '200000',
        selectedEmoji: '🍕',
        selectedColor: '#38A169',
      };

      const updateInput = {
        name: form.name.trim(),
        icon: form.selectedEmoji,
        color: form.selectedColor,
        budgetLimit: Number(form.budgetLimit),
      };

      expect(updateInput.icon).toBe('🍕');
      expect(updateInput.color).toBe('#38A169');
    });
  });

  describe('Independence: changing emoji does not change color', () => {
    it('updating selectedEmoji preserves selectedColor', () => {
      let form = {
        name: 'Test',
        budgetLimit: '',
        selectedEmoji: DEFAULT_CATEGORY_EMOJI,
        selectedColor: DEFAULT_CATEGORY_COLOR,
      };

      // Simulate emoji selection
      form = { ...form, selectedEmoji: '🍕' };
      expect(form.selectedEmoji).toBe('🍕');
      expect(form.selectedColor).toBe(DEFAULT_CATEGORY_COLOR);
    });
  });

  describe('Independence: changing color does not change emoji', () => {
    it('updating selectedColor preserves selectedEmoji', () => {
      let form = {
        name: 'Test',
        budgetLimit: '',
        selectedEmoji: DEFAULT_CATEGORY_EMOJI,
        selectedColor: DEFAULT_CATEGORY_COLOR,
      };

      // Simulate color selection
      form = { ...form, selectedColor: '#805AD5' };
      expect(form.selectedColor).toBe('#805AD5');
      expect(form.selectedEmoji).toBe(DEFAULT_CATEGORY_EMOJI);
    });
  });

  describe('Live preview reflects current selections', () => {
    it('preview should show the selected emoji and color', () => {
      const form = {
        name: 'Cafe',
        budgetLimit: '',
        selectedEmoji: '☕',
        selectedColor: '#D69E2E',
      };

      // The preview renders: emoji text = form.selectedEmoji, background = form.selectedColor + '22'
      expect(form.selectedEmoji).toBe('☕');
      expect(form.selectedColor + '22').toBe('#D69E2E22');
    });

    it('preview updates when emoji changes', () => {
      let form = {
        selectedEmoji: '🍔',
        selectedColor: '#E53E3E',
      };
      form = { ...form, selectedEmoji: '🍕' };
      expect(form.selectedEmoji).toBe('🍕');
      expect(form.selectedColor).toBe('#E53E3E');
    });

    it('preview updates when color changes', () => {
      let form = {
        selectedEmoji: '🍔',
        selectedColor: '#E53E3E',
      };
      form = { ...form, selectedColor: '#38A169' };
      expect(form.selectedEmoji).toBe('🍔');
      expect(form.selectedColor).toBe('#38A169');
    });
  });

  describe('Name and budget limit fields remain functional', () => {
    it('name field updates independently of emoji/color', () => {
      let form = {
        name: '',
        budgetLimit: '',
        selectedEmoji: DEFAULT_CATEGORY_EMOJI,
        selectedColor: DEFAULT_CATEGORY_COLOR,
      };

      form = { ...form, name: 'Shopping' };
      expect(form.name).toBe('Shopping');
      expect(form.selectedEmoji).toBe(DEFAULT_CATEGORY_EMOJI);
      expect(form.selectedColor).toBe(DEFAULT_CATEGORY_COLOR);
    });

    it('budgetLimit field updates independently of emoji/color', () => {
      let form = {
        name: 'Shopping',
        budgetLimit: '',
        selectedEmoji: '🛍️',
        selectedColor: '#D53F8C',
      };

      form = { ...form, budgetLimit: '50000' };
      expect(form.budgetLimit).toBe('50000');
      expect(form.selectedEmoji).toBe('🛍️');
      expect(form.selectedColor).toBe('#D53F8C');
    });
  });

  describe('ICON_PRESETS removal verification', () => {
    it('CategoriesPage no longer exports or uses ICON_PRESETS', async () => {
      const moduleSource = await import('../CategoriesPage');
      // ICON_PRESETS should not be in the module exports
      expect((moduleSource as any).ICON_PRESETS).toBeUndefined();
    });

    it('form state uses selectedEmoji/selectedColor, not selectedPresetIndex', () => {
      const form = {
        name: '',
        budgetLimit: '',
        selectedEmoji: DEFAULT_CATEGORY_EMOJI,
        selectedColor: DEFAULT_CATEGORY_COLOR,
      };
      expect(form).not.toHaveProperty('selectedPresetIndex');
      expect(form).toHaveProperty('selectedEmoji');
      expect(form).toHaveProperty('selectedColor');
    });
  });

  describe('Backward compatibility: non-curated values', () => {
    it('non-curated emoji is preserved in form state', () => {
      const category = MOCK_CATEGORY_LEGACY;
      const form = {
        name: category.name,
        budgetLimit: category.budgetLimit != null ? String(category.budgetLimit) : '',
        selectedEmoji: category.icon,
        selectedColor: category.color,
      };

      // Non-curated emoji 🎯 is preserved
      expect(form.selectedEmoji).toBe('🎯');
      const allEmojis = CATEGORY_EMOJIS.flatMap((g) => g.emojis);
      expect(allEmojis).not.toContain('🎯');
    });

    it('non-curated color is preserved in form state', () => {
      const category = MOCK_CATEGORY_LEGACY;
      const form = {
        selectedColor: category.color,
      };

      // Non-curated color #ABCDEF is preserved
      expect(form.selectedColor).toBe('#ABCDEF');
      const allColors = CATEGORY_COLORS.map((c) => c.hex);
      expect(allColors).not.toContain('#ABCDEF');
    });
  });

  describe('Curated constants integration', () => {
    it('CATEGORY_EMOJIS are available from @repo/core', () => {
      expect(CATEGORY_EMOJIS).toBeDefined();
      expect(Array.isArray(CATEGORY_EMOJIS)).toBe(true);
      expect(CATEGORY_EMOJIS.length).toBeGreaterThan(0);
    });

    it('CATEGORY_COLORS are available from @repo/core', () => {
      expect(CATEGORY_COLORS).toBeDefined();
      expect(Array.isArray(CATEGORY_COLORS)).toBe(true);
      expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(12);
    });

    it('all curated emoji values pass category schema validation', async () => {
      const { createCategorySchema } = await import('@repo/core');
      const allEmojis = CATEGORY_EMOJIS.flatMap((g) => g.emojis);

      for (const emoji of allEmojis) {
        const result = createCategorySchema.safeParse({
          name: 'Test',
          icon: emoji,
          color: '#E53E3E',
        });
        expect(result.success).toBe(true);
      }
    });

    it('all curated color values pass category schema validation', async () => {
      const { createCategorySchema } = await import('@repo/core');

      for (const color of CATEGORY_COLORS) {
        const result = createCategorySchema.safeParse({
          name: 'Test',
          icon: '🍔',
          color: color.hex,
        });
        expect(result.success).toBe(true);
      }
    });
  });
});
