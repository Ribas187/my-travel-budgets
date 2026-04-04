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
