export interface EmojiGroup {
  groupKey: string;
  emojis: string[];
}

export const CATEGORY_EMOJIS: EmojiGroup[] = [
  {
    groupKey: 'category.emojiGroup.food',
    emojis: ['🍔', '🍕', '☕', '🍺', '🍷', '🍣', '🍦'],
  },
  {
    groupKey: 'category.emojiGroup.transport',
    emojis: ['🚗', '✈️', '🚌', '🚕', '🚂', '⛽', '🚢'],
  },
  {
    groupKey: 'category.emojiGroup.accommodation',
    emojis: ['🏨', '🏠', '⛺', '🛏️'],
  },
  {
    groupKey: 'category.emojiGroup.activities',
    emojis: ['🎭', '🏖️', '🎿', '🥾', '📸', '🎢'],
  },
  {
    groupKey: 'category.emojiGroup.shopping',
    emojis: ['🛍️', '👕', '🎁', '💎'],
  },
  {
    groupKey: 'category.emojiGroup.health',
    emojis: ['💊', '🏥', '🧴'],
  },
  {
    groupKey: 'category.emojiGroup.services',
    emojis: ['📱', '💇', '🧺', '📦'],
  },
  {
    groupKey: 'category.emojiGroup.other',
    emojis: ['💰', '📝', '🔑', '🎫', '❓'],
  },
];

export const DEFAULT_CATEGORY_EMOJI = CATEGORY_EMOJIS[0].emojis[0];
