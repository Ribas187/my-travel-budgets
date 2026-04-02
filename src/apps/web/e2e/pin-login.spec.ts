import { test, expect } from '@playwright/test';

import { setupApiMocks } from './mocks/handlers';

const TEST_EMAIL = 'test@example.com';

// ─── Happy Path ─────────────────────────────────────────────────────────────

test.describe('PIN login — happy path', () => {
  test('should complete full PIN login flow: email → code → OTP → authenticated → /travels', async ({
    page,
  }) => {
    const state = await setupApiMocks(page);
    await page.goto('/login');

    // Enter email
    const emailInput = page.locator('#login-email');
    await emailInput.fill(TEST_EMAIL);

    // Verify "Send me a code" is the default selected method
    const codeOption = page.locator('[role="radio"][data-value="pin"]');
    await expect(codeOption).toHaveAttribute('aria-checked', 'true');

    // Submit — button should say "Send me a code"
    await page.getByRole('button', { name: /send me a code/i }).click();

    // OTP input view should render
    await expect(page.getByText(/enter your code/i)).toBeVisible();
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();

    // Verify a PIN was created in mock state
    expect(state.pins.length).toBe(1);
    const pinValue = state.pins[0]!.pin;

    // Type the PIN digits into the OTP input
    await page.keyboard.type(pinValue, { delay: 50 });

    // Auto-submit should fire and redirect to /travels
    await page.waitForURL('**/travels**');
    await expect(page).toHaveURL(/\/travels/);

    // Verify JWT is stored (user is authenticated)
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });
});

// ─── Method Toggle ──────────────────────────────────────────────────────────

test.describe('PIN login — method toggle', () => {
  test('should switch between link and code methods', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/login');

    const emailInput = page.locator('#login-email');
    await emailInput.fill(TEST_EMAIL);

    // Select "Send me a link"
    const linkOption = page.locator('[role="radio"][data-value="link"]');
    await linkOption.click();
    await expect(linkOption).toHaveAttribute('aria-checked', 'true');

    // Submit with link method → should show "Check your email" view
    await page.getByRole('button', { name: /send me a link/i }).click();
    await expect(page.getByText(/check your email/i)).toBeVisible();
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();

    // Go back to login form by clicking "Send magic link" text
    await page.getByText(/send magic link/i).click();

    // Now select "Send me a code"
    const codeOption = page.locator('[role="radio"][data-value="pin"]');
    await codeOption.click();
    await expect(codeOption).toHaveAttribute('aria-checked', 'true');

    // Submit with code method → should show OTP input
    await page.getByRole('button', { name: /send me a code/i }).click();
    await expect(page.getByText(/enter your code/i)).toBeVisible();
  });
});

// ─── Invalid Code ───────────────────────────────────────────────────────────

test.describe('PIN login — invalid code', () => {
  test('should display error message for wrong PIN and stay on OTP screen', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/login');

    // Enter email and request code
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send me a code/i }).click();

    // Verify OTP view is shown
    await expect(page.getByText(/enter your code/i)).toBeVisible();

    // Enter wrong 6-digit code
    await page.keyboard.type('999999', { delay: 50 });

    // Should show error message
    await expect(page.getByText(/invalid code/i)).toBeVisible();

    // Should still be on the OTP screen (not redirected)
    await expect(page.getByText(/enter your code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── Expired Code ───────────────────────────────────────────────────────────

test.describe('PIN login — expired code', () => {
  test('should display expired message for past-expiry PIN', async ({ page }) => {
    const state = await setupApiMocks(page);
    await page.goto('/login');

    // Enter email and request code
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send me a code/i }).click();

    await expect(page.getByText(/enter your code/i)).toBeVisible();

    // Manually expire the PIN in mock state
    state.pins[0]!.expiresAt = new Date(Date.now() - 1000);

    // Enter the correct PIN (but it's expired)
    const pinValue = state.pins[0]!.pin;
    await page.keyboard.type(pinValue, { delay: 50 });

    // Should show "Code expired" error
    await expect(page.getByText(/code expired/i)).toBeVisible();

    // Should stay on OTP screen
    await expect(page.getByText(/enter your code/i)).toBeVisible();
  });
});

// ─── Resend Code ────────────────────────────────────────────────────────────

test.describe('PIN login — resend code', () => {
  test('should disable resend during cooldown and allow resend after', async ({ page }) => {
    const state = await setupApiMocks(page);
    await page.goto('/login');

    // Enter email and request code
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send me a code/i }).click();

    await expect(page.getByText(/enter your code/i)).toBeVisible();

    // Resend button should be visible but disabled during cooldown
    const resendButton = page.locator('[role="button"]', { hasText: /resend code/i });
    await expect(resendButton).toBeVisible();
    await expect(resendButton).toHaveAttribute('aria-disabled', 'true');

    // Verify cooldown text shows seconds count
    await expect(resendButton).toContainText(/\d+s/);

    // Wait for cooldown to expire (30s) — use Playwright's expect with extended timeout
    await expect(resendButton).not.toHaveAttribute('aria-disabled', 'true', { timeout: 35000 });

    // After cooldown, resend text should not show countdown
    await expect(resendButton).not.toContainText(/\d+s/);

    // Invalidate the first PIN so only the second one works
    state.pins[0]!.usedAt = new Date();

    // Click resend and wait for the API call to complete
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login-pin') && res.status() === 202),
      resendButton.click(),
    ]);

    // A new PIN should be created
    expect(state.pins.length).toBe(2);

    // Click on OTP area to re-focus the input, then type the new PIN
    await page.locator('[data-input-otp="true"]').click();
    const newPin = state.pins[1]!.pin;
    await page.keyboard.type(newPin, { delay: 50 });

    // Should auto-submit and redirect
    await page.waitForURL('**/travels**');
    await expect(page).toHaveURL(/\/travels/);
  });
});

// ─── Accessibility ──────────────────────────────────────────────────────────

test.describe('PIN login — accessibility', () => {
  test('should have proper ARIA attributes on method selector', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/login');

    // Method selector should be a radiogroup
    const radiogroup = page.locator('[role="radiogroup"]');
    await expect(radiogroup).toBeVisible();
    await expect(radiogroup).toHaveAttribute('aria-label');

    // Individual options should be radio buttons with aria-checked
    const codeRadio = page.locator('[role="radio"][data-value="pin"]');
    const linkRadio = page.locator('[role="radio"][data-value="link"]');
    await expect(codeRadio).toHaveAttribute('aria-checked', 'true');
    await expect(linkRadio).toHaveAttribute('aria-checked', 'false');
    await expect(codeRadio).toHaveAttribute('aria-label');
    await expect(linkRadio).toHaveAttribute('aria-label');
  });

  test('should have aria-live on error messages in OTP view', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/login');

    // Request PIN
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send me a code/i }).click();
    await expect(page.getByText(/enter your code/i)).toBeVisible();

    // Enter wrong code to trigger error
    await page.keyboard.type('999999', { delay: 50 });

    // Error message should have aria-live="polite"
    const errorElement = page.locator('[aria-live="polite"]');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveAttribute('role', 'alert');
  });

  test('should support keyboard navigation for OTP input', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/login');

    // Request PIN
    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send me a code/i }).click();
    await expect(page.getByText(/enter your code/i)).toBeVisible();

    // OTP input should auto-focus — type digits with keyboard
    await page.keyboard.type('12', { delay: 50 });

    // Verify digits appear in the OTP slots
    await expect(page.locator('text=1').first()).toBeVisible();
    await expect(page.locator('text=2').first()).toBeVisible();

    // Backspace should delete last digit
    await page.keyboard.press('Backspace');

    // Type remaining digits to complete
    await page.keyboard.type('2345', { delay: 50 });

    // Should not have auto-submitted yet (only 5 digits total: 1,2,3,4,5)
    // The 6th digit will trigger auto-submit — but we only typed 5 after backspace
    // Verify we're still on the OTP screen
    await expect(page.getByText(/enter your code/i)).toBeVisible();
  });

  test('should have accessible email input with label', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/login');

    // Email input should have an aria-label
    const emailInput = page.locator('#login-email');
    await expect(emailInput).toHaveAttribute('aria-label');
  });
});
