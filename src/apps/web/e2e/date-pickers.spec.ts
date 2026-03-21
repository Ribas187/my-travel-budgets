import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TRAVEL_ID,
  CAT_FOOD_ID,
  CAT_TRANSPORT_ID,
  MEMBER_ID,
  EXPENSE_ID,
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

// ─── Test: Categories back navigation ────────────────────────────────────────

test.describe('Categories back navigation', () => {
  test('click back arrow navigates to travel dashboard', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    // Navigate to categories page
    await page.goto(`/travels/${TRAVEL_ID}/categories`);

    // Verify the back header is visible
    await expect(page.locator('[data-testid="back-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="back-header-button"]')).toBeVisible();

    // Click the back arrow
    await page.locator('[data-testid="back-header-button"]').click();

    // Verify URL navigated back to travel dashboard
    await page.waitForURL(new RegExp(`/travels/${TRAVEL_ID}$`));
    await expect(page).toHaveURL(new RegExp(`/travels/${TRAVEL_ID}$`));
  });
});

// ─── Test: Trip date pickers ─────────────────────────────────────────────────

test.describe('Trip date pickers', () => {
  test('edit trip shows date pickers with pre-selected dates', async ({ page }, testInfo) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    const isMobile = testInfo.project.name === 'mobile';

    // Navigate to edit trip page
    await page.goto(`/travels/${TRAVEL_ID}/edit`);

    // Wait for the form to load
    await expect(page.locator('[data-testid="trip-form"]')).toBeVisible();

    // Verify start date DatePickerInput is visible
    await expect(page.locator('[data-testid="trip-start-date-input"]')).toBeVisible();

    // Verify end date DatePickerInput is visible
    await expect(page.locator('[data-testid="trip-end-date-input"]')).toBeVisible();

    // The start date input should show a formatted date (Jun 1, 2026 or similar)
    const startInput = page.locator('[data-testid="trip-start-date-input-input"]');
    await expect(async () => {
      const startValue = await startInput.inputValue();
      expect(startValue).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // Click the start date calendar button to open the popover/sheet
    await page.locator('[data-testid="trip-start-date-input-calendar-button"]').click();

    // Verify the calendar is visible (react-day-picker renders with .rdp-root)
    await expect(page.locator('.rdp-root')).toBeVisible({ timeout: 10000 });

    // Select a different day in the calendar (click on day 10)
    const dayButton = page.locator('.rdp-day-button-custom').filter({ hasText: '10' }).first();
    await dayButton.click();

    // On desktop, the popover closes automatically after selection
    // On mobile, Tamagui Sheet keeps content mounted off-screen — verify via viewport check
    if (isMobile) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      await expect(page.locator('.rdp-root')).not.toBeVisible({ timeout: 10000 });
    }

    // Save the trip
    await page.locator('[data-testid="save-trip-button"]').click({ force: true });

    // Verify the trip was saved with updated date
    await expect(async () => {
      const travel = state.travelDetail;
      // The start date should have been updated (contains "10" day)
      expect(travel.startDate).toContain('10');
    }).toPass({ timeout: 5000 });
  });
});

// ─── Test: Expense date picker ───────────────────────────────────────────────

test.describe('Expense date picker', () => {
  test('add expense shows date field with today default', async ({ page }, testInfo) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    const isMobile = testInfo.project.name === 'mobile';

    await page.goto(`/travels/${TRAVEL_ID}`);

    // Open add expense modal
    if (isMobile) {
      await page.locator('[data-testid="fab-button"]').click();
    } else {
      await page
        .locator('[data-testid="desktop-sidebar"]')
        .getByRole('button', { name: /add expense/i })
        .click();
    }

    await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible();

    // Verify the date field is visible
    await expect(page.locator('[data-testid="expense-date-input"]')).toBeVisible();

    // The date input should show today's date formatted
    const dateInput = page.locator('[data-testid="expense-date-input-input"]');
    await expect(async () => {
      const dateValue = await dateInput.inputValue();
      expect(dateValue).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // Click the calendar button to open the date picker
    await page.locator('[data-testid="expense-date-input-calendar-button"]').click();

    // Verify the calendar is visible
    await expect(page.locator('.rdp-root')).toBeVisible({ timeout: 5000 });

    // Select a different day (day 5)
    const dayButton = page.locator('.rdp-day-button-custom').filter({ hasText: '5' }).first();
    await dayButton.click();

    // On desktop, the popover closes automatically after selection
    // On mobile, Tamagui Sheet keeps content mounted off-screen
    if (isMobile) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      await expect(page.locator('.rdp-root')).not.toBeVisible({ timeout: 10000 });
    }

    // Fill in other required fields to make the form valid
    // Amount
    await page.locator('[data-testid="amount-input"]').fill('25.00');
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement;
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Description
    await page.locator('[data-testid="description-input"]').fill('Test expense');

    // Select first category
    const firstCategory = page.locator('[data-testid="category-chips"]').locator('div[role="radio"]').first();
    if (await firstCategory.isVisible()) {
      await firstCategory.click();
    }

    // Save the expense
    await page.locator('[data-testid="save-expense-button"]').click({ force: true });

    // Verify the expense was saved with a date containing "5"
    await expect(async () => {
      const newExpense = state.expenses.find((e) => e.description === 'Test expense');
      expect(newExpense).toBeDefined();
      expect(newExpense!.date).toContain('05');
    }).toPass({ timeout: 10000 });
  });

  test('edit expense pre-selects existing date', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Click the first expense to open edit modal
    await page.locator(`[data-testid="expense-row-pressable-${EXPENSE_ID}"]`).click();
    await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible();

    // Verify the date field is visible and has the expense's date
    await expect(page.locator('[data-testid="expense-date-input"]')).toBeVisible();

    const dateInput = page.locator('[data-testid="expense-date-input-input"]');
    await expect(async () => {
      const dateValue = await dateInput.inputValue();
      // Should show the expense's date (Jun 2, 2026) in some formatted form
      expect(dateValue).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });
});
