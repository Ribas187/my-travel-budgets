import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TEST_TRAVEL,
  TEST_TRAVEL_2,
  TRAVEL_ID,
  TRAVEL_ID_2,
} from './mocks/fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setupAuthenticated(page: Page) {
  const state = await setupApiMocks(page);
  await page.goto('/');
  await authenticatePage(page, TEST_TOKEN);
  return state;
}

function addTravelsToState(state: Awaited<ReturnType<typeof setupApiMocks>>) {
  state.travels.push(
    { ...TEST_TRAVEL },
    { ...TEST_TRAVEL_2 },
  );
}

// ─── Test 1: Profile Back Navigation ─────────────────────────────────────────

test.describe('Profile back navigation', () => {
  test('back button navigates to previous page when navigating from travels', async ({ page }) => {
    const state = await setupAuthenticated(page);
    addTravelsToState(state);

    // Navigate to travels list first
    await page.goto('/travels');
    await expect(page.locator('[data-testid="travels-list"]')).toBeVisible();

    // Navigate to profile
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Verify back button exists
    await expect(page.locator('[data-testid="back-header-button"]')).toBeVisible();

    // Click back button
    await page.locator('[data-testid="back-header-button"]').click();

    // Should navigate back to travels list
    await page.waitForURL('**/travels');
    await expect(page).toHaveURL(/\/travels/);
  });

  test('back button from direct access navigates to /travels', async ({ page }) => {
    const state = await setupAuthenticated(page);
    addTravelsToState(state);

    // Navigate directly to profile (no prior history)
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Click back button
    await page.locator('[data-testid="back-header-button"]').click();

    // Should navigate to /travels as fallback
    await page.waitForURL('**/travels**');
    await expect(page).toHaveURL(/\/travels/);
  });
});

// ─── Test 2: Avatar Fallback ─────────────────────────────────────────────────

test.describe('Avatar fallback', () => {
  test('shows User icon instead of "?" for nameless user', async ({ page }) => {
    const state = await setupAuthenticated(page);

    // Set user to have no name
    state.user = { ...state.user, name: '' };

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Verify User icon SVG renders (not "?" text)
    await expect(page.locator('[data-testid="profile-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-avatar-icon"]')).toBeVisible();

    // Verify no "?" text in avatar area
    const avatarText = await page.locator('[data-testid="profile-avatar"]').textContent();
    expect(avatarText).not.toContain('?');
  });
});

// ─── Test 3: Star Toggle on Travels ──────────────────────────────────────────

test.describe('Set main travel', () => {
  test('star icon toggles main travel on travel cards', async ({ page }) => {
    const state = await setupAuthenticated(page);
    addTravelsToState(state);

    await page.goto('/travels');
    await expect(page.locator('[data-testid="travels-list"]')).toBeVisible();

    // Click star on first travel
    await page.locator(`[data-testid="star-toggle-${TRAVEL_ID}"]`).click();

    // Verify star becomes filled (wait for API response + re-render)
    await expect(async () => {
      expect(state.user.mainTravelId).toBe(TRAVEL_ID);
    }).toPass({ timeout: 5000 });

    // Verify star is filled visually
    await expect(page.locator(`[data-testid="star-toggle-${TRAVEL_ID}"] [data-testid="star-filled"]`)).toBeVisible();

    // Click star on second travel
    await page.locator(`[data-testid="star-toggle-${TRAVEL_ID_2}"]`).click();

    // Verify first star is unfilled, second is filled
    await expect(async () => {
      expect(state.user.mainTravelId).toBe(TRAVEL_ID_2);
    }).toPass({ timeout: 5000 });

    await expect(page.locator(`[data-testid="star-toggle-${TRAVEL_ID}"] [data-testid="star-outline"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="star-toggle-${TRAVEL_ID_2}"] [data-testid="star-filled"]`)).toBeVisible();

    // Click filled star to clear
    await page.locator(`[data-testid="star-toggle-${TRAVEL_ID_2}"]`).click();

    // Verify cleared
    await expect(async () => {
      expect(state.user.mainTravelId).toBeNull();
    }).toPass({ timeout: 5000 });

    await expect(page.locator(`[data-testid="star-toggle-${TRAVEL_ID_2}"] [data-testid="star-outline"]`)).toBeVisible();
  });
});

// ─── Test 4: Login Redirect with Main Travel ─────────────────────────────────

test.describe('Login redirect with main travel', () => {
  test('redirects to summary when main travel is set', async ({ page }) => {
    const state = await setupApiMocks(page);
    state.travels.push({ ...TEST_TRAVEL });
    state.user = { ...state.user, mainTravelId: TRAVEL_ID };

    // Navigate to login first so localStorage is accessible
    await page.goto('/login');
    await authenticatePage(page, TEST_TOKEN);

    // Navigate to root — should redirect to main travel summary
    await page.goto('/');
    await page.waitForURL(`**/travels/${TRAVEL_ID}/summary`, { timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`/travels/${TRAVEL_ID}/summary`));
  });
});

// ─── Test 5: Login Redirect without Main Travel ──────────────────────────────

test.describe('Login redirect without main travel', () => {
  test('redirects to travels list when no main travel is set', async ({ page }) => {
    const state = await setupApiMocks(page);
    state.travels.push({ ...TEST_TRAVEL });
    // mainTravelId is null by default

    await page.goto('/login');
    await authenticatePage(page, TEST_TOKEN);

    // Navigate to root — should redirect to travels list
    await page.goto('/');
    await page.waitForURL('**/travels');
    await expect(page).toHaveURL(/\/travels$/);
  });
});

// ─── Test 6: Deleted Main Travel Fallback ────────────────────────────────────

test.describe('Deleted main travel fallback', () => {
  test('redirects to travels list when main travel no longer exists', async ({ page }) => {
    const state = await setupApiMocks(page);
    state.travels.push({ ...TEST_TRAVEL });
    // Set mainTravelId to a travel that doesn't exist in the list
    state.user = { ...state.user, mainTravelId: '00000000-0000-4000-8000-999999999999' };

    await page.goto('/login');
    await authenticatePage(page, TEST_TOKEN);

    // Navigate to root — should fallback to travels list since the travel is not accessible
    await page.goto('/');
    await page.waitForURL('**/travels');
    await expect(page).toHaveURL(/\/travels/);
    // Should not be on an error page
    await expect(page.locator('text=Error')).not.toBeVisible();
  });
});

// ─── Test 7: Profile "My Travels" Navigation ────────────────────────────────

test.describe('Profile "My Travels" navigation', () => {
  test('"My Travels" on profile navigates to /travels', async ({ page }) => {
    const state = await setupAuthenticated(page);
    addTravelsToState(state);

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Verify "My Travels" row exists
    await expect(page.locator('[data-testid="my-travels-row"]')).toBeVisible();

    // Click "My Travels"
    await page.locator('[data-testid="my-travels-row"]').click();

    // Should navigate to travels list
    await page.waitForURL('**/travels');
    await expect(page).toHaveURL(/\/travels/);
  });
});

// ─── Test 8: Accessibility ───────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test('back button has accessible label', async ({ page }) => {
    await setupAuthenticated(page);

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // BackHeader button has aria-label
    const backButton = page.locator('[data-testid="back-header-button"]');
    await expect(backButton).toHaveAttribute('aria-label');
  });

  test('star icons have aria-labels', async ({ page }) => {
    const state = await setupAuthenticated(page);
    addTravelsToState(state);

    await page.goto('/travels');
    await expect(page.locator('[data-testid="travels-list"]')).toBeVisible();

    // Star toggle buttons have aria-label
    const starButton = page.locator(`[data-testid="star-toggle-${TRAVEL_ID}"]`);
    await expect(starButton).toHaveAttribute('aria-label');
  });

  test('"My Travels" row is keyboard-reachable', async ({ page }) => {
    await setupAuthenticated(page);

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // My Travels row has role="button" and aria-label
    const myTravelsRow = page.locator('[data-testid="my-travels-row"]');
    await expect(myTravelsRow).toHaveAttribute('role', 'button');
    await expect(myTravelsRow).toHaveAttribute('aria-label');
  });
});
