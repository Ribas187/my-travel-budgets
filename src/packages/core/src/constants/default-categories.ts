export interface DefaultCategory {
  nameKey: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { nameKey: 'onboarding.defaultCategory.food', icon: '🍔', color: '#f97316' },
  { nameKey: 'onboarding.defaultCategory.transport', icon: '🚕', color: '#3b82f6' },
  { nameKey: 'onboarding.defaultCategory.accommodation', icon: '🏨', color: '#8b5cf6' },
  { nameKey: 'onboarding.defaultCategory.activities', icon: '🎯', color: '#10b981' },
  { nameKey: 'onboarding.defaultCategory.shopping', icon: '🛍️', color: '#ec4899' },
  { nameKey: 'onboarding.defaultCategory.other', icon: '📦', color: '#6b7280' },
] as const;
