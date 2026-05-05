import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Page, Route } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TRAVEL_ID,
  CAT_FOOD_ID,
  TEST_TRAVEL,
  TEST_CATEGORY_FOOD,
} from './mocks/fixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECEIPT_FIXTURE_PATH = path.join(__dirname, '__fixtures__', 'receipt.jpg');

const STUB_EXTRACTION = {
  total: 87.5,
  date: '2026-06-10',
  merchant: 'Café de Paris',
};

async function setupAuthenticatedTravelWithCategory(page: Page) {
  const state = await setupApiMocks(page);
  await page.goto('/');
  await authenticatePage(page, TEST_TOKEN);

  // Bypass the onboarding wizard so /travels/:id/expenses is reachable.
  state.user = { ...state.user, onboardingCompletedAt: '2026-01-01T00:00:00.000Z' };
  state.travels.push({ ...TEST_TRAVEL });
  state.categories.push({ ...TEST_CATEGORY_FOOD });
  state.travelDetail = {
    ...state.travelDetail,
    categories: state.categories as typeof state.travelDetail.categories,
  };

  return state;
}

interface ReceiptRouteState {
  callCount: number;
}

/**
 * Installs a Playwright route override for the receipts extraction endpoint.
 * The vision provider is "stubbed" at the API boundary — no OPENROUTER_API_KEY
 * is needed because no real backend runs during e2e.
 */
async function stubReceiptsExtract(
  page: Page,
  responder: (callIndex: number, route: Route) => Promise<void> | void,
): Promise<ReceiptRouteState> {
  const state: ReceiptRouteState = { callCount: 0 };
  await page.route(/\/travels\/[^/]+\/receipts\/extract$/, async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }
    const callIndex = state.callCount;
    state.callCount += 1;
    await responder(callIndex, route);
  });
  return state;
}

async function openAddExpenseModal(page: Page) {
  await page.goto(`/travels/${TRAVEL_ID}/expenses`);
  await page.waitForSelector('[data-testid="expense-list-container"]');
  const addButton = page.getByRole('button', { name: /add expense/i });
  await addButton.first().click();
  await page.waitForSelector('[data-testid="add-expense-modal"]');
}

async function selectReceiptFile(page: Page) {
  // The hidden input lives at `${testID}-input`. Playwright can drive
  // setInputFiles on hidden inputs; we briefly toggle display to maximize
  // compatibility with strict actionability checks (matches avatar-upload).
  const fileInput = page.locator('[data-testid="scan-receipt-button-input"]');
  await fileInput.evaluate((el) => {
    (el as HTMLInputElement).style.display = 'block';
  });
  await fileInput.setInputFiles(RECEIPT_FIXTURE_PATH);
  await fileInput.evaluate((el) => {
    (el as HTMLInputElement).style.display = 'none';
  });
}

// ─── Happy Path ──────────────────────────────────────────────────────────────

test.describe('Scan receipt — happy path', () => {
  test('prefills modal from extraction, lets user edit, and saves expense', async ({ page }) => {
    const state = await setupAuthenticatedTravelWithCategory(page);

    await stubReceiptsExtract(page, async (_i, route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(STUB_EXTRACTION),
      });
    });

    await openAddExpenseModal(page);

    // The Scan receipt button is visible and labelled.
    const scanButton = page.getByRole('button', { name: /scan receipt/i });
    await expect(scanButton).toBeVisible();

    await selectReceiptFile(page);

    // Wait for prefill to take effect — the description input gets the merchant.
    const descriptionInput = page.locator('[data-testid="description-input"]');
    await expect(descriptionInput).toHaveValue(STUB_EXTRACTION.merchant, { timeout: 10000 });

    // Date input is pre-filled with the extracted ISO date.
    const dateInput = page.locator('[data-testid="expense-date-input-input"]');
    await expect(dateInput).toHaveValue(STUB_EXTRACTION.date);

    // Amount display shows the extracted total ($87.50).
    const formContainer = page.locator('[data-testid="add-expense-form"]');
    await expect(formContainer.getByText('87', { exact: true })).toBeVisible();
    await expect(formContainer.getByText('.50', { exact: true })).toBeVisible();

    // Edit the description before saving.
    await descriptionInput.fill('Lunch at Café de Paris');

    // Pick the existing Food & Drinks category (required for the form to be valid).
    await page.locator('[data-testid="category-chips"]').getByText('Food & Drinks').click();

    await page.waitForTimeout(300);
    await page.locator('[data-testid="save-expense-button"]').click({ force: true });

    // Saved expense flows through the existing create-expense path and lands
    // in the list with the edited description and the extracted amount.
    await expect(async () => {
      expect(state.expenses.length).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    expect(state.expenses[0]?.description).toBe('Lunch at Café de Paris');
    expect(state.expenses[0]?.amount).toBe(STUB_EXTRACTION.total);
    expect(state.expenses[0]?.date).toBe(STUB_EXTRACTION.date);
    expect(state.expenses[0]?.categoryId).toBe(CAT_FOOD_ID);

    // The expense renders in the list (the list refetches on success).
    await expect(page.getByText('Lunch at Café de Paris')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Failure Path ────────────────────────────────────────────────────────────

test.describe('Scan receipt — failure path', () => {
  test('shows error and offers Retry that succeeds on second attempt', async ({ page }) => {
    await setupAuthenticatedTravelWithCategory(page);

    // First call → 502 upstream failure; second call → 200 with the stub payload.
    await stubReceiptsExtract(page, async (callIndex, route) => {
      if (callIndex === 0) {
        await route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Upstream vision provider failed' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(STUB_EXTRACTION),
        });
      }
    });

    await openAddExpenseModal(page);
    await selectReceiptFile(page);

    // Localized upstream error appears with Retry + Continue manually actions.
    const errorBox = page.locator('[data-testid="scan-receipt-error"]');
    await expect(errorBox).toBeVisible({ timeout: 10000 });
    await expect(errorBox).toHaveText(/scanner is unavailable/i);

    const retry = page.locator('[data-testid="scan-receipt-retry"]');
    const continueManually = page.locator('[data-testid="scan-receipt-continue-manually"]');
    await expect(retry).toBeVisible();
    await expect(continueManually).toBeVisible();

    // Retry triggers a second extraction with the same image — this time it
    // succeeds and the form prefills.
    await retry.click();

    await expect(errorBox).not.toBeVisible({ timeout: 10000 });
    const descriptionInput = page.locator('[data-testid="description-input"]');
    await expect(descriptionInput).toHaveValue(STUB_EXTRACTION.merchant, { timeout: 10000 });
  });

  test('Continue manually clears the error and leaves the form blank for manual entry', async ({ page }) => {
    await setupAuthenticatedTravelWithCategory(page);

    // Always fail — user falls back to manual entry.
    await stubReceiptsExtract(page, async (_i, route) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Upstream vision provider failed' }),
      });
    });

    await openAddExpenseModal(page);
    await selectReceiptFile(page);

    const errorBox = page.locator('[data-testid="scan-receipt-error"]');
    await expect(errorBox).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="scan-receipt-continue-manually"]').click();

    // Error UI dismissed; the user can keep editing the form normally.
    await expect(errorBox).not.toBeVisible();
    await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="description-input"]')).toHaveValue('');
  });
});

// ─── Accessibility ───────────────────────────────────────────────────────────

test.describe('Scan receipt — accessibility', () => {
  test('Scan receipt button has a non-empty accessible name and is keyboard-focusable', async ({ page }) => {
    await setupAuthenticatedTravelWithCategory(page);

    // Stub still installed so the button doesn't trigger a network failure
    // if focus accidentally activates it.
    await stubReceiptsExtract(page, async (_i, route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(STUB_EXTRACTION),
      });
    });

    await openAddExpenseModal(page);

    // Modal exposes a labeled dialog role.
    const modal = page.locator('[data-testid="add-expense-modal"]');
    await expect(modal).toHaveAttribute('role', 'dialog');
    const dialogLabel = await modal.getAttribute('aria-label');
    expect(dialogLabel?.length ?? 0).toBeGreaterThan(0);

    // The button is announced with a non-empty accessible name.
    const scanButton = page.getByRole('button', { name: /scan receipt/i });
    await expect(scanButton).toBeVisible();
    const accessibleName = await scanButton.getAttribute('aria-label');
    expect(accessibleName).toBeTruthy();
    expect(accessibleName?.trim().length ?? 0).toBeGreaterThan(0);

    // The button can receive focus — a hard requirement for keyboard reachability.
    await scanButton.focus();
    await expect(scanButton).toBeFocused();
  });

  // Regression: BUG-03 — Enter on the focused button MUST open the file
  // picker, not silently no-op (PRD: "Scan receipt action MUST be
  // keyboard-operable").
  test('Enter key on focused Scan receipt button opens the file picker', async ({ page }) => {
    await setupAuthenticatedTravelWithCategory(page);

    await stubReceiptsExtract(page, async (_i, route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(STUB_EXTRACTION),
      });
    });

    await openAddExpenseModal(page);

    // Spy on the hidden file input's click() — the picker open is implemented
    // by calling .click() on it, so this is a direct, deterministic check that
    // does not depend on the OS-native file chooser actually appearing.
    await page.evaluate(() => {
      const input = document.querySelector(
        '[data-testid="scan-receipt-button-input"]',
      ) as HTMLInputElement | null;
      if (!input) return;
      (window as unknown as { __pickerClicks: number }).__pickerClicks = 0;
      const originalClick = input.click.bind(input);
      input.click = () => {
        (window as unknown as { __pickerClicks: number }).__pickerClicks += 1;
        // Don't call original — we don't want a real file chooser dialog.
        void originalClick;
      };
    });

    const scanButton = page.getByRole('button', { name: /scan receipt/i });
    await scanButton.focus();
    await page.keyboard.press('Enter');

    const clicksAfterEnter = await page.evaluate(
      () => (window as unknown as { __pickerClicks: number }).__pickerClicks,
    );
    expect(clicksAfterEnter).toBeGreaterThanOrEqual(1);

    // Space should also work.
    await scanButton.focus();
    await page.keyboard.press('Space');

    const clicksAfterSpace = await page.evaluate(
      () => (window as unknown as { __pickerClicks: number }).__pickerClicks,
    );
    expect(clicksAfterSpace).toBeGreaterThanOrEqual(2);
  });
});

// ─── Stale prefill on reopen (BUG-01) ────────────────────────────────────────

test.describe('Scan receipt — modal reopen behavior', () => {
  // Regression: BUG-01 — after a successful scan-and-save, reopening the
  // Add Expense modal MUST start with an empty form (not the previous
  // merchant/date that came from the scan).
  test('Add Expense modal reopens with empty fields after a scan-and-save', async ({ page }) => {
    const state = await setupAuthenticatedTravelWithCategory(page);

    await stubReceiptsExtract(page, async (_i, route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(STUB_EXTRACTION),
      });
    });

    await openAddExpenseModal(page);
    await selectReceiptFile(page);

    const descriptionInput = page.locator('[data-testid="description-input"]');
    await expect(descriptionInput).toHaveValue(STUB_EXTRACTION.merchant, { timeout: 10000 });

    // Save the scanned expense through the existing flow.
    await page.locator('[data-testid="category-chips"]').getByText('Food & Drinks').click();
    await page.waitForTimeout(200);
    await page.locator('[data-testid="save-expense-button"]').click({ force: true });

    await expect(async () => {
      expect(state.expenses.length).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Wait for modal to close.
    await expect(page.locator('[data-testid="add-expense-modal"]')).toHaveCount(0, { timeout: 5000 });

    // Reopen — and verify the form is fresh, not carrying the previous merchant/date.
    const addButton = page.getByRole('button', { name: /add expense/i }).first();
    await addButton.click();
    await page.waitForSelector('[data-testid="add-expense-modal"]');

    const descriptionInputAfter = page.locator('[data-testid="description-input"]');
    await expect(descriptionInputAfter).toHaveValue('');

    // Date input should reset to today, not the scanned date.
    const dateInputAfter = page.locator('[data-testid="expense-date-input-input"]');
    const today = new Date().toISOString().slice(0, 10);
    await expect(dateInputAfter).toHaveValue(today);
  });

  // Regression: BUG-05 / RF 4.5 — user can discard scanned values back to defaults.
  test('Discard scanned values clears prefill back to defaults', async ({ page }) => {
    await setupAuthenticatedTravelWithCategory(page);

    await stubReceiptsExtract(page, async (_i, route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(STUB_EXTRACTION),
      });
    });

    await openAddExpenseModal(page);
    await selectReceiptFile(page);

    const descriptionInput = page.locator('[data-testid="description-input"]');
    await expect(descriptionInput).toHaveValue(STUB_EXTRACTION.merchant, { timeout: 10000 });

    const discard = page.locator('[data-testid="scan-receipt-discard"]');
    await expect(discard).toBeVisible();
    await discard.click();

    await expect(descriptionInput).toHaveValue('');
    const dateInput = page.locator('[data-testid="expense-date-input-input"]');
    const today = new Date().toISOString().slice(0, 10);
    await expect(dateInput).toHaveValue(today);
  });
});
