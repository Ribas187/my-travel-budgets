import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TRAVEL_ID,
  CAT_FOOD_ID,
  CAT_TRANSPORT_ID,
  TEST_EXPENSE,
  TEST_EXPENSE_2,
} from './mocks/fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setupAuthenticatedWithTravel(page: import('@playwright/test').Page) {
  const state = await setupApiMocks(page);
  await page.goto('/');
  await authenticatePage(page, TEST_TOKEN);

  state.travels.push({
    id: TRAVEL_ID,
    name: 'Summer in Europe',
    description: 'Paris, Rome, Barcelona',
    imageUrl: null,
    currency: 'EUR',
    budget: 3000,
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  return state;
}

function addCategoriesToState(state: Awaited<ReturnType<typeof setupApiMocks>>) {
  state.categories.push(
    {
      id: CAT_FOOD_ID,
      travelId: TRAVEL_ID,
      name: 'Food & Drinks',
      icon: '🍔',
      color: '#F59E0B',
      budgetLimit: 500,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: CAT_TRANSPORT_ID,
      travelId: TRAVEL_ID,
      name: 'Transport',
      icon: '🚗',
      color: '#3B82F6',
      budgetLimit: 300,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  );
  state.travelDetail = {
    ...state.travelDetail,
    categories: state.categories as any,
  };
}

function addExpensesToState(state: Awaited<ReturnType<typeof setupApiMocks>>) {
  state.expenses.push({ ...TEST_EXPENSE }, { ...TEST_EXPENSE_2 });
}

// ─── Mobile-only tests (390x844 viewport per task spec) ─────────────────────

test.describe('Mobile navigation flows', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // Skip desktop project — these tests are mobile-only
  test.beforeEach(({}, testInfo) => {
    if (testInfo.project.name === 'desktop') {
      test.skip();
    }
  });

  // ─── 6.2: BottomNav stays visible after scrolling ─────────────────────────

  test('BottomNav stays visible after scrolling', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}`);
    await expect(page.locator('[data-testid="dashboard-mobile"]')).toBeVisible();

    // Verify bottom nav is visible before scrolling
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).toBeVisible();

    // Scroll the content area to the bottom
    await page.evaluate(() => {
      const scrollable = document.querySelector('[data-testid="mobile-content"]')
        ?? document.querySelector('main')
        ?? document.documentElement;
      scrollable.scrollTop = scrollable.scrollHeight;
    });

    // Wait a tick for any layout recalculation
    await page.waitForTimeout(300);

    // Assert BottomNav is still visible in the viewport
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav).toBeInViewport();
  });

  // ─── 6.3: "Ver tudo" / "See all" navigates to Budget Breakdown ────────────

  test('"See all" in By Category navigates to Budget Breakdown', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}`);
    await expect(page.locator('[data-testid="dashboard-mobile"]')).toBeVisible();

    // Find the "See all" button in the By Category section
    const seeAllButton = page.getByRole('button', { name: /see all/i });
    await expect(seeAllButton).toBeVisible();
    await seeAllButton.click();

    // Assert URL navigated to budget route
    await page.waitForURL(`**/travels/${TRAVEL_ID}/budget`);
    await expect(page).toHaveURL(new RegExp(`/travels/${TRAVEL_ID}/budget`));
    await expect(page.locator('[data-testid="budget-breakdown-page"]')).toBeVisible();
  });

  // ─── 6.4: "Ver todas" / "View all" navigates to Expense List ──────────────

  test('"View all" in Recent Expenses navigates to Expense List', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}`);
    await expect(page.locator('[data-testid="dashboard-mobile"]')).toBeVisible();

    // Find the "View all" button in the Recent Expenses section
    const viewAllButton = page.getByRole('button', { name: /view all/i });
    await expect(viewAllButton).toBeVisible();
    await viewAllButton.click();

    // Assert URL navigated to expenses route
    await page.waitForURL(`**/travels/${TRAVEL_ID}/expenses`);
    await expect(page).toHaveURL(new RegExp(`/travels/${TRAVEL_ID}/expenses`));
    await expect(page.locator('[data-testid="expense-list-container"]')).toBeVisible();
  });

  // ─── 6.5: Profile sheet flow — avatar → sheet → Profile ───────────────────

  test('Avatar opens NavigationSheet, "Profile" navigates to profile page', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}`);
    await expect(page.locator('[data-testid="dashboard-mobile"]')).toBeVisible();

    // Click the avatar in the header
    const avatar = page.locator('[data-testid="header-avatar"]');
    await expect(avatar).toBeVisible();
    await avatar.click();

    // Assert the navigation sheet is visible
    const sheet = page.locator('[data-testid="navigation-sheet"]');
    await expect(sheet).toBeVisible();

    // Click the "Profile" item
    const profileItem = page.locator('[data-testid="nav-sheet-item-profile"]');
    await expect(profileItem).toBeVisible();
    await profileItem.click();

    // Assert navigated to profile page
    await page.waitForURL('**/profile');
    await expect(page).toHaveURL(/\/profile/);
  });

  // ─── 6.6: Budget Breakdown → Manage Categories ────────────────────────────

  test('"Manage" on Budget Breakdown navigates to Categories', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/budget`);
    await expect(page.locator('[data-testid="budget-breakdown-page"]')).toBeVisible();

    // Find the "Manage" action button in the section header
    const manageButton = page.getByRole('button', { name: /manage/i });
    await expect(manageButton).toBeVisible();
    await manageButton.click();

    // Assert URL navigated to categories route
    await page.waitForURL(`**/travels/${TRAVEL_ID}/categories`);
    await expect(page).toHaveURL(new RegExp(`/travels/${TRAVEL_ID}/categories`));
  });

  // ─── 6.7: Accessibility — ARIA attributes on navigation elements ──────────

  test('navigation elements have appropriate ARIA attributes', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}`);
    await expect(page.locator('[data-testid="dashboard-mobile"]')).toBeVisible();

    // Header avatar has role="button" and aria-label
    const avatar = page.locator('[data-testid="header-avatar"]');
    await expect(avatar).toHaveAttribute('role', 'button');
    await expect(avatar).toHaveAttribute('aria-label', 'Open navigation menu');

    // "See all" action has role="button"
    const seeAllButton = page.getByRole('button', { name: /see all/i });
    await expect(seeAllButton).toBeVisible();

    // "View all" action has role="button"
    const viewAllButton = page.getByRole('button', { name: /view all/i });
    await expect(viewAllButton).toBeVisible();

    // Open navigation sheet and check items
    await avatar.click();
    const sheet = page.locator('[data-testid="navigation-sheet"]');
    await expect(sheet).toBeVisible();

    // Sheet items have role="button" and aria-label
    const profileItem = page.locator('[data-testid="nav-sheet-item-profile"]');
    await expect(profileItem).toHaveAttribute('role', 'button');
    await expect(profileItem).toHaveAttribute('aria-label', 'Profile');

    const logoutItem = page.locator('[data-testid="nav-sheet-item-logout"]');
    await expect(logoutItem).toHaveAttribute('role', 'button');
    await expect(logoutItem).toHaveAttribute('aria-label', 'Logout');

    const myTravelsItem = page.locator('[data-testid="nav-sheet-item-myTravels"]');
    await expect(myTravelsItem).toHaveAttribute('role', 'button');
    await expect(myTravelsItem).toHaveAttribute('aria-label', 'My Travels');
  });
});
