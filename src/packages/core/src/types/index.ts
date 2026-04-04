export type { CreateUserInput, UpdateUserInput } from '../schemas/user';
export type { CreateTravelInput, UpdateTravelInput } from '../schemas/travel';
export type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category';
export type { CreateExpenseInput, UpdateExpenseInput } from '../schemas/expense';
export type { AddMemberInput } from '../schemas/member';
export type { Currency } from '../constants/currencies';

export type MemberRole = 'owner' | 'member';

export type OnboardingTipId =
  | 'dashboard_first_visit'
  | 'expenses_no_categories'
  | 'summary_first_visit'
  | 'budget_progress_bar'
  | 'members_invite_button'
  | 'category_budget_limit';

export const ONBOARDING_TIP_IDS: readonly OnboardingTipId[] = [
  'dashboard_first_visit',
  'expenses_no_categories',
  'summary_first_visit',
  'budget_progress_bar',
  'members_invite_button',
  'category_budget_limit',
] as const;

export interface DefaultCategory {
  nameKey: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { nameKey: 'onboarding.category.food', icon: '🍔', color: '#E53E3E' },
  { nameKey: 'onboarding.category.transport', icon: '🚗', color: '#3182CE' },
  { nameKey: 'onboarding.category.accommodation', icon: '🏨', color: '#805AD5' },
  { nameKey: 'onboarding.category.activities', icon: '🎭', color: '#38A169' },
  { nameKey: 'onboarding.category.shopping', icon: '🛍️', color: '#D69E2E' },
  { nameKey: 'onboarding.category.other', icon: '💰', color: '#2D3748' },
] as const;
