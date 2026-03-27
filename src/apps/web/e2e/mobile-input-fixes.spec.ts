import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TRAVEL_ID,
  CAT_FOOD_ID,
  CAT_TRANSPORT_ID,
  EXPENSE_ID,
  TEST_EXPENSE,
  TEST_EXPENSE_2,
} from './mocks/fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setupAuthenticatedWithTravel(page: Page) {
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
    categories: state.categories as typeof state.travelDetail.categories,
  };
}

function addExpensesToState(state: Awaited<ReturnType<typeof setupApiMocks>>) {
  state.expenses.push({ ...TEST_EXPENSE }, { ...TEST_EXPENSE_2 });
}

// ─── Calculator Input: Expense Flow ─────────────────────────────────────────

test.describe('Calculator input — expense flow', () => {
  test('type digits "2599" → display shows currency symbol + "25.99"', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Open add expense modal
    const addButton = page.getByRole('button', { name: /add expense/i });
    await addButton.first().click();
    await page.waitForSelector('[data-testid="add-expense-modal"]');

    // Focus the hidden amount input and type digits
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement;
      input?.focus();
    });
    await page.keyboard.type('2599', { delay: 30 });

    // Verify the display shows "25" (integer) and ".99" (decimal)
    const modal = page.locator('[data-testid="add-expense-modal"]');
    await expect(modal.getByText('25')).toBeVisible();
    await expect(modal.getByText('.99')).toBeVisible();

    // Verify currency symbol is visible (EUR → €)
    await expect(modal.getByText('€')).toBeVisible();
  });

  test('submit expense with calculator input → correct amount saved', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Open add expense modal
    const addButton = page.getByRole('button', { name: /add expense/i });
    await addButton.first().click();
    await page.waitForSelector('[data-testid="add-expense-modal"]');

    // Type amount: 2599 → $25.99
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement;
      input?.focus();
    });
    await page.keyboard.type('2599', { delay: 30 });

    // Fill description
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="description-input"]') as HTMLInputElement;
      input?.scrollIntoView({ block: 'center' });
      input?.focus();
    });
    await page.keyboard.type('Calculator test expense', { delay: 10 });

    // Select category
    await page.locator('[data-testid="category-chips"]').getByText('Food & Drinks').click();

    await page.waitForTimeout(500);

    // Save
    await page.locator('[data-testid="save-expense-button"]').click({ force: true });

    // Verify the expense was saved with amount 25.99
    await expect(async () => {
      const newExpense = state.expenses.find((e) => e.description === 'Calculator test expense');
      expect(newExpense).toBeDefined();
      expect(newExpense!.amount).toBe(25.99);
    }).toPass({ timeout: 10000 });
  });

  test('edit expense → amount is pre-filled with existing value', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);
    addExpensesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Click expense to open edit modal
    await page.locator(`[data-testid="expense-row-pressable-${EXPENSE_ID}"]`).click();
    await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible();

    // The original expense has amount 42.5 → display should show "42" and ".50"
    const modal = page.locator('[data-testid="add-expense-modal"]');
    await expect(modal.getByText('42')).toBeVisible();
    await expect(modal.getByText('.50')).toBeVisible();
  });
});

// ─── Calculator Input: Travel Budget Flow ───────────────────────────────────

test.describe('Calculator input — travel budget flow', () => {
  test('type "100000" into budget → display shows "1000.00"', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await authenticatePage(page, TEST_TOKEN);

    await page.goto('/travels/new');
    await expect(page.locator('[data-testid="trip-form"]')).toBeVisible();

    // Focus the hidden budget input and type digits
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="trip-budget-input"]') as HTMLInputElement;
      input?.focus();
    });
    await page.keyboard.type('100000', { delay: 30 });

    // Verify display shows "1000" (integer) and ".00" (decimal)
    const form = page.locator('[data-testid="trip-budget-container"]');
    await expect(form.getByText('1000')).toBeVisible();
    await expect(form.getByText('.00')).toBeVisible();
  });

  test('create travel with calculator budget → correct amount saved', async ({ page }) => {
    const state = await setupApiMocks(page);
    await page.goto('/');
    await authenticatePage(page, TEST_TOKEN);

    await page.goto('/travels/new');
    await expect(page.locator('[data-testid="trip-form"]')).toBeVisible();

    // Fill trip name
    await page.locator('[data-testid="trip-name-input"]').fill('Budget Test Trip');

    // Fill dates
    await page.locator('[data-testid="trip-start-date-input-input"]').fill('2026-07-01');
    await page.locator('[data-testid="trip-end-date-input-input"]').fill('2026-07-15');

    // Select currency
    await page.locator('[data-testid="trip-currency-select"]').click();
    await page.locator('[data-testid="currency-option-USD"]').click();

    // Type budget: 100000 → $1000.00
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="trip-budget-input"]') as HTMLInputElement;
      input?.focus();
    });
    await page.keyboard.type('100000', { delay: 30 });

    await page.waitForTimeout(500);

    // Save
    await page.locator('[data-testid="save-trip-button"]').click({ force: true });

    // Verify travel was created with budget 1000
    await expect(async () => {
      const newTravel = state.travels.find((t) => t.name === 'Budget Test Trip');
      expect(newTravel).toBeDefined();
      expect(newTravel!.budget).toBe(1000);
    }).toPass({ timeout: 10000 });
  });
});

// ─── Date Overflow: 375px Viewport ──────────────────────────────────────────

test.describe('Date overflow — 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('travel form: both date inputs are fully visible at 375px', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await authenticatePage(page, TEST_TOKEN);

    await page.goto('/travels/new');
    await expect(page.locator('[data-testid="trip-form"]')).toBeVisible();

    // Both date input containers should be visible
    const startDate = page.locator('[data-testid="trip-start-date-input"]');
    const endDate = page.locator('[data-testid="trip-end-date-input"]');
    await expect(startDate).toBeVisible();
    await expect(endDate).toBeVisible();

    // Verify bounding boxes are within viewport (375px width)
    const startBox = await startDate.boundingBox();
    const endBox = await endDate.boundingBox();
    expect(startBox).not.toBeNull();
    expect(endBox).not.toBeNull();

    // Right edge of each input should be within viewport
    expect(startBox!.x + startBox!.width).toBeLessThanOrEqual(375);
    expect(endBox!.x + endBox!.width).toBeLessThanOrEqual(375);

    // Left edge should be >= 0
    expect(startBox!.x).toBeGreaterThanOrEqual(0);
    expect(endBox!.x).toBeGreaterThanOrEqual(0);
  });

  test('travel form: date inputs remain side-by-side (not stacked)', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await authenticatePage(page, TEST_TOKEN);

    await page.goto('/travels/new');
    await expect(page.locator('[data-testid="trip-form"]')).toBeVisible();

    const startBox = await page.locator('[data-testid="trip-start-date-input"]').boundingBox();
    const endBox = await page.locator('[data-testid="trip-end-date-input"]').boundingBox();
    expect(startBox).not.toBeNull();
    expect(endBox).not.toBeNull();

    // Side-by-side: they should share roughly the same Y coordinate
    // (allow small variance for label differences)
    expect(Math.abs(startBox!.y - endBox!.y)).toBeLessThan(30);

    // And the end date should be to the right of the start date
    expect(endBox!.x).toBeGreaterThan(startBox!.x);
  });

  test('expense modal: date input is fully visible at 375px', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/expenses`);
    await page.waitForSelector('[data-testid="expense-list-container"]');

    // Open add expense modal (mobile: FAB button)
    await page.locator('[data-testid="fab-button"]').click();
    await page.waitForSelector('[data-testid="add-expense-modal"]');

    // Verify date input is visible
    const dateInput = page.locator('[data-testid="expense-date-input"]');
    await expect(dateInput).toBeVisible();

    // Verify bounding box is within viewport
    const dateBox = await dateInput.boundingBox();
    expect(dateBox).not.toBeNull();
    expect(dateBox!.x + dateBox!.width).toBeLessThanOrEqual(375);
    expect(dateBox!.x).toBeGreaterThanOrEqual(0);
  });

  test('date text is not clipped — full date string is readable', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoriesToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/edit`);
    await expect(page.locator('[data-testid="trip-form"]')).toBeVisible();

    // The start date input should have a value (2026-06-01)
    const startInput = page.locator('[data-testid="trip-start-date-input-input"]');
    await expect(async () => {
      const val = await startInput.inputValue();
      expect(val).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // The input should not be clipped — its bounding box width should be positive
    const inputBox = await startInput.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(inputBox!.width).toBeGreaterThan(50);
    // And within viewport
    expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(375);
  });
});
