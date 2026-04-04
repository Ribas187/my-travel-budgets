import { describe, it, expect } from 'vitest';

import { ONBOARDING_TIP_IDS } from '../onboarding';
import type { OnboardingTipId } from '../onboarding';

describe('ONBOARDING_TIP_IDS', () => {
  const expectedTipIds: OnboardingTipId[] = [
    'dashboard_first_visit',
    'expenses_no_categories',
    'summary_first_visit',
    'budget_progress_bar',
    'members_invite_button',
    'category_budget_limit',
  ];

  it('contains exactly 6 tip IDs', () => {
    expect(ONBOARDING_TIP_IDS).toHaveLength(6);
  });

  it('includes all expected tip IDs', () => {
    for (const tipId of expectedTipIds) {
      expect(ONBOARDING_TIP_IDS).toContain(tipId);
    }
  });

  it('has no duplicate entries', () => {
    const unique = new Set(ONBOARDING_TIP_IDS);
    expect(unique.size).toBe(ONBOARDING_TIP_IDS.length);
  });

  it('every entry matches the snake_case pattern', () => {
    for (const tipId of ONBOARDING_TIP_IDS) {
      expect(tipId).toMatch(/^[a-z]+(_[a-z]+)+$/);
    }
  });

  it('type-checks: all IDs are assignable to OnboardingTipId', () => {
    const ids: OnboardingTipId[] = [...ONBOARDING_TIP_IDS];
    expect(ids).toEqual(ONBOARDING_TIP_IDS);
  });
});
