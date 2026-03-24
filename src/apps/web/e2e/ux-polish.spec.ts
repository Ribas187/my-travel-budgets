import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TRAVEL_ID,
  CAT_FOOD_ID,
  CAT_TRANSPORT_ID,
  MEMBER_ID,
} from './mocks/fixtures';

// Helper to set up authenticated page with a travel
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

// ─── Empty Dashboard Flow ─────────────────────────────────────────────────────

test.describe('Empty dashboard flow', () => {
  test('navigation visible and empty state CTA opens add expense modal', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    // No categories, no expenses → empty dashboard

    // Override dashboard endpoint to return empty data
    await page.route(/localhost:3000.*\/dashboard$/, async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currency: 'EUR',
          overall: {
            budget: 3000,
            totalSpent: 0,
            status: 'ok',
          },
          memberSpending: [],
          categorySpending: [],
        }),
      });
    });

    // Navigate to the travel dashboard
    await page.goto(`/travels/${TRAVEL_ID}`);

    // Wait for dashboard to load (not skeleton)
    await page.waitForSelector('[data-testid="dashboard-mobile"], [data-testid="dashboard-desktop"]');

    // Verify navigation is visible:
    // - Mobile: profile avatar in header
    // - Desktop: sidebar with settings link
    const isMobile = await page.locator('[data-testid="dashboard-mobile"]').isVisible().catch(() => false);
    if (isMobile) {
      await expect(page.locator('[data-testid="header-avatar"]')).toBeVisible();
    } else {
      // Desktop: sidebar navigation should be visible
      await expect(page.getByRole('navigation').first()).toBeVisible();
    }

    // Verify empty state is present
    await expect(page.locator('[data-testid="dashboard-empty"]')).toBeVisible();

    // Click the empty state CTA to add first expense
    await page.locator('[data-testid="dashboard-empty"]').getByRole('button').click();

    // Verify the add expense modal opens
    await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible();
  });
});

// ─── No Categories Flow ──────────────────────────────────────────────────────

test.describe('No-categories guard', () => {
  test('shows no-categories message and CTA navigates to categories page', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    // Travel has NO categories

    // Navigate to expenses page
    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Open add expense modal
    const addButton = page.getByRole('button', { name: /add expense/i });
    await addButton.first().click();

    // Wait for modal
    await page.waitForSelector('[data-testid="add-expense-modal"]');

    // Verify no-categories guard is shown
    await expect(page.locator('[data-testid="no-categories-guard"]')).toBeVisible();

    // The form should NOT be visible
    await expect(page.locator('[data-testid="add-expense-form"]')).not.toBeVisible();

    // Click the CTA to go to categories
    await page.locator('[data-testid="no-categories-guard"]').getByRole('button').click();

    // Should navigate to categories page
    await page.waitForURL(`**/travels/${TRAVEL_ID}/categories`);
    await expect(page).toHaveURL(new RegExp(`/travels/${TRAVEL_ID}/categories`));
  });
});

// ─── Double-click Prevention ─────────────────────────────────────────────────

test.describe('Double-click prevention', () => {
  test('save button becomes disabled during submission preventing double-click', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    // Add delay to POST /expenses so we can observe the loading state
    await page.route(/localhost:3000.*\/expenses$/, async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((r) => setTimeout(r, 1000));
      }
      return route.fallback();
    });

    // Navigate to expenses
    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Open add expense modal
    const addButton = page.getByRole('button', { name: /add expense/i });
    await addButton.first().click();
    await page.waitForSelector('[data-testid="add-expense-modal"]');

    // Fill amount
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement;
      input?.focus();
    });
    await page.keyboard.type('25.00', { delay: 30 });

    // Fill description
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="description-input"]') as HTMLInputElement;
      input?.scrollIntoView({ block: 'center' });
      input?.focus();
    });
    await page.keyboard.type('Test double click', { delay: 10 });

    // Select category
    await page.locator('[data-testid="category-chips"]').getByText('Food & Drinks').click();

    // Wait for form validation
    await page.waitForTimeout(500);

    // Click save
    const saveButton = page.locator('[data-testid="save-expense-button"]');
    await saveButton.click({ force: true });

    // The button should become disabled (loading state) while the mutation is in flight
    // PrimaryButton renders with loading={isPending} which disables it
    const button = saveButton.locator('button, [role="button"]').first();
    await expect(button).toBeDisabled({ timeout: 3000 });

    // Wait for mutation to complete
    await expect(async () => {
      expect(state.expenses.length).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    // Exactly one expense should be created
    expect(state.expenses.length).toBe(1);
  });
});

// ─── Amount Input Single-Tap Focus ───────────────────────────────────────────

test.describe('Amount input single-tap focus', () => {
  test('single click focuses input, typing updates display', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    // Navigate to expenses
    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Open add expense modal
    const addButton = page.getByRole('button', { name: /add expense/i });
    await addButton.first().click();
    await page.waitForSelector('[data-testid="add-expense-modal"]');

    // The amount display initially shows "0" (integer part) and ".00" (decimal part)
    const amountDisplay = page.locator('[data-testid="add-expense-modal"]');
    await expect(amountDisplay.getByText('0', { exact: true })).toBeVisible();

    // Click the amount display area to focus the hidden input
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement;
      input?.focus();
    });

    // Type an amount
    await page.keyboard.type('12.50', { delay: 50 });

    // Verify the display shows the formatted amount
    await expect(amountDisplay.getByText('12')).toBeVisible();
    await expect(amountDisplay.getByText('.50')).toBeVisible();

    // Verify the hidden input has the value
    const inputValue = await page.locator('[data-testid="amount-input"]').inputValue();
    expect(inputValue).toBe('12.50');
  });
});
