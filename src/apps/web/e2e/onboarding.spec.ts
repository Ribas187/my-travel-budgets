import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TEST_TRAVEL,
  TRAVEL_ID,
  TEST_CATEGORY_FOOD,
  TEST_CATEGORY_TRANSPORT,
  TEST_DASHBOARD_EMPTY,
} from './mocks/fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Set up an authenticated page with mock API routes. */
async function setupAuthenticated(page: Page) {
  const state = await setupApiMocks(page);
  await page.goto('/');
  await authenticatePage(page, TEST_TOKEN);
  return state;
}

/** Set up a new user (onboarding NOT completed). */
async function setupNewUser(page: Page) {
  const state = await setupAuthenticated(page);
  state.user = {
    ...state.user,
    onboardingCompletedAt: null,
    dismissedTips: [],
  };
  return state;
}

/** Set up a returning user (onboarding already completed). */
async function setupReturningUser(page: Page) {
  const state = await setupAuthenticated(page);
  state.user = {
    ...state.user,
    onboardingCompletedAt: '2026-01-15T00:00:00.000Z',
    dismissedTips: [],
  };
  return state;
}

/** Set up a returning user with travels and categories. */
async function setupReturningUserWithTravel(page: Page) {
  const state = await setupReturningUser(page);
  state.travels.push({ ...TEST_TRAVEL });
  state.categories.push({ ...TEST_CATEGORY_FOOD }, { ...TEST_CATEGORY_TRANSPORT });
  return state;
}

// ─── Test 1: Full Wizard Completion ─────────────────────────────────────────

test.describe('Onboarding — full wizard completion', () => {
  test('new user completes all 4 wizard steps and lands on trip dashboard', async ({ page }) => {
    const state = await setupNewUser(page);

    // Navigate — beforeLoad redirect should show the wizard
    await page.goto('/travels');

    // Step 1: Welcome view should be visible (redirect renders wizard content)
    await expect(page.locator('[data-testid="onboarding-wizard"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="welcome-title"]')).toBeVisible();

    // Click "Get Started" to advance to step 2
    await page.locator('[data-testid="get-started-button"]').click();

    // Step 2: Trip form should be visible
    await expect(page.locator('[data-testid="onboarding-trip-form-view"]')).toBeVisible({
      timeout: 10000,
    });

    // Fill trip name and description (field group 0)
    await page.locator('[data-testid="trip-name-input"]').fill('Summer in Italy');
    await page.locator('[data-testid="trip-description-input"]').fill('Rome, Florence');

    // Click Next to go to field group 1 (dates)
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.locator('[data-testid="field-group-dates"]')).toBeVisible();

    // Fill dates
    await page.locator('[data-testid="trip-start-date-input"]').fill('2026-07-01');
    await page.locator('[data-testid="trip-end-date-input"]').fill('2026-07-14');

    // Click Next to go to field group 2 (budget)
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.locator('[data-testid="field-group-budget"]')).toBeVisible();

    // Fill currency and budget
    await page.locator('[data-testid="trip-currency-input"]').fill('EUR');
    await page.locator('[data-testid="trip-budget-input"]').fill('3000');

    // Click Next to submit the trip and advance to step 3
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Categories view should appear
    await expect(page.locator('[data-testid="onboarding-categories-view"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify a travel was created in mock state
    expect(state.travels.length).toBe(1);
    expect(state.travels[0]!.name).toBe('Summer in Italy');

    // Click Next to create categories and advance to step 4
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Ready view should appear
    await expect(page.locator('[data-testid="onboarding-ready-view"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify categories were created
    expect(state.categories.length).toBeGreaterThan(0);

    // Click "Go to dashboard" to complete onboarding
    await page.locator('[data-testid="go-to-dashboard-button"]').click();

    // Verify onboarding was marked complete
    await expect(async () => {
      expect(state.user.onboardingCompletedAt).not.toBeNull();
    }).toPass({ timeout: 10000 });

    // Wizard should disappear and travel content should appear
    await expect(page.locator('[data-testid="onboarding-ready-view"]')).not.toBeVisible({
      timeout: 15000,
    });
  });
});

// ─── Test 2: Skip at Step 1 ────────────────────────────────────────────────

test.describe('Onboarding — skip at step 1', () => {
  test('new user skips at step 1 and lands on travels list', async ({ page }) => {
    const state = await setupNewUser(page);

    // Navigate — should show wizard via redirect
    await page.goto('/travels');

    // Step 1: Welcome view should be visible
    await expect(page.locator('[data-testid="onboarding-wizard"]')).toBeVisible({
      timeout: 10000,
    });

    // Click "Skip"
    await page.locator('[data-testid="skip-button"]').click();

    // Onboarding should be marked complete
    await expect(async () => {
      expect(state.user.onboardingCompletedAt).not.toBeNull();
    }).toPass({ timeout: 10000 });

    // Wizard should disappear
    await expect(page.locator('[data-testid="onboarding-wizard"]')).not.toBeVisible({
      timeout: 15000,
    });

    // No trip should have been created
    expect(state.travels.length).toBe(0);
  });
});

// ─── Test 3: Skip at Step 2 ────────────────────────────────────────────────

test.describe('Onboarding — skip at step 2', () => {
  test('new user skips at step 2, no trip created', async ({ page }) => {
    const state = await setupNewUser(page);

    // Navigate — should show wizard via redirect
    await page.goto('/travels');

    // Step 1: Advance past welcome
    await expect(page.locator('[data-testid="onboarding-wizard"]')).toBeVisible({
      timeout: 10000,
    });
    await page.locator('[data-testid="get-started-button"]').click();

    // Step 2: Trip form visible
    await expect(page.locator('[data-testid="onboarding-trip-form-view"]')).toBeVisible({
      timeout: 10000,
    });

    // Click "Skip"
    await page.locator('[data-testid="skip-button"]').click();

    // Onboarding should be marked complete
    await expect(async () => {
      expect(state.user.onboardingCompletedAt).not.toBeNull();
    }).toPass({ timeout: 10000 });

    // Wizard should disappear
    await expect(page.locator('[data-testid="onboarding-wizard"]')).not.toBeVisible({
      timeout: 15000,
    });

    // No trip should have been created
    expect(state.travels.length).toBe(0);
  });
});

// ─── Test 4: Returning User — No Wizard Redirect ───────────────────────────

test.describe('Onboarding — returning user navigates normally', () => {
  test('returning user with completed onboarding is NOT redirected to wizard', async ({ page }) => {
    await setupReturningUserWithTravel(page);

    // Navigate to travels list
    await page.goto('/travels');

    // Should stay on travels — NOT be redirected to /onboarding
    await expect(page.locator('[data-testid="travels-list"]')).toBeVisible({ timeout: 10000 });

    // Onboarding wizard should not be visible
    await expect(page.locator('[data-testid="onboarding-wizard"]')).not.toBeVisible();
  });
});

// ─── Test 5: Dashboard Tip Appears and Can Be Dismissed ─────────────────────

test.describe('Onboarding — dashboard contextual tip', () => {
  test('dashboard shows tip for user with 0 expenses, dismissing removes it', async ({ page }) => {
    const state = await setupReturningUserWithTravel(page);

    // Set dashboard to empty (0 expenses, 0 spending)
    state.expenses = [];
    state.dashboard = TEST_DASHBOARD_EMPTY;

    // Navigate to the dashboard for the travel
    await page.goto(`/travels/${TRAVEL_ID}`);

    // Wait for the inline tip to appear
    await expect(page.locator('[data-testid="inline-tip-dashboard_first_visit"]')).toBeVisible({
      timeout: 15000,
    });

    // Dismiss the tip by clicking the dismiss button (X)
    await page
      .locator('[data-testid="inline-tip-dashboard_first_visit"]')
      .locator('[role="button"]')
      .first()
      .click();

    // Tip should disappear
    await expect(
      page.locator('[data-testid="inline-tip-dashboard_first_visit"]'),
    ).not.toBeVisible({ timeout: 5000 });

    // Verify tip was dismissed in state
    await expect(async () => {
      expect(state.user.dismissedTips).toContain('dashboard_first_visit');
    }).toPass({ timeout: 5000 });
  });
});

// ─── Test 6: Dismissed Tip Does Not Reappear After Reload ───────────────────

test.describe('Onboarding — dismissed tip persistence', () => {
  test('dismissed tip does not reappear after page reload', async ({ page }) => {
    const state = await setupReturningUserWithTravel(page);
    state.expenses = [];
    state.dashboard = TEST_DASHBOARD_EMPTY;

    // Pre-dismiss the tip in the user state
    state.user = {
      ...state.user,
      dismissedTips: ['dashboard_first_visit'],
    };

    // Navigate to dashboard
    await page.goto(`/travels/${TRAVEL_ID}`);

    // Wait for the page to load (look for any dashboard content)
    await expect(
      page.locator('[role="main"]'),
    ).toBeVisible({ timeout: 10000 });
    // Give a moment for tips to render if they would
    await page.waitForTimeout(2000);

    // The tip should NOT be visible (it was already dismissed)
    await expect(
      page.locator('[data-testid="inline-tip-dashboard_first_visit"]'),
    ).not.toBeVisible();

    // Reload the page
    await page.reload();

    // After reload, wait for page to load again
    await expect(
      page.locator('[role="main"]'),
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Tip should still NOT be visible
    await expect(
      page.locator('[data-testid="inline-tip-dashboard_first_visit"]'),
    ).not.toBeVisible();
  });
});

// ─── Test 7: Profile "Replay Onboarding" ───────────────────────────────────

test.describe('Onboarding — profile replay onboarding', () => {
  test('replay onboarding button clears onboardingCompletedAt and triggers wizard redirect', async ({
    page,
  }) => {
    const state = await setupReturningUserWithTravel(page);

    // Navigate to profile
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Click "Replay onboarding" button
    const replayButton = page.locator('[data-testid="replay-onboarding-button"]');
    await expect(replayButton).toBeVisible();
    await replayButton.click();

    // Verify the onboarding state was reset
    await expect(async () => {
      expect(state.user.onboardingCompletedAt).toBeNull();
    }).toPass({ timeout: 5000 });

    // Navigate away — should be redirected to wizard
    await page.goto('/travels');

    // Wizard should be visible (due to beforeLoad redirect)
    await expect(page.locator('[data-testid="onboarding-wizard"]')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Test 8: Profile "Reset Tips" ──────────────────────────────────────────

test.describe('Onboarding — profile reset tips', () => {
  test('reset tips button clears dismissed tips and re-enables them on pages', async ({ page }) => {
    const state = await setupReturningUserWithTravel(page);
    state.expenses = [];
    state.dashboard = TEST_DASHBOARD_EMPTY;

    // Start with a dismissed tip
    state.user = {
      ...state.user,
      dismissedTips: ['dashboard_first_visit'],
    };

    // Navigate to profile
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Click "Reset tips" button
    const resetButton = page.locator('[data-testid="reset-tips-button"]');
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Verify tips were reset in state
    await expect(async () => {
      expect(state.user.dismissedTips).toEqual([]);
    }).toPass({ timeout: 5000 });

    // Navigate to dashboard — the tip should reappear
    await page.goto(`/travels/${TRAVEL_ID}`);

    // The previously dismissed tip should now be visible again
    await expect(
      page.locator('[data-testid="inline-tip-dashboard_first_visit"]'),
    ).toBeVisible({ timeout: 15000 });
  });
});
