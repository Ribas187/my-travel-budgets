import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import {
  TEST_TOKEN,
  TEST_TRAVEL,
  TEST_AVATAR_URL,
  TRAVEL_ID,
} from './mocks/fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setupAuthenticated(page: import('@playwright/test').Page) {
  const state = await setupApiMocks(page);
  await page.goto('/');
  await authenticatePage(page, TEST_TOKEN);
  return state;
}

function addTravelToState(state: Awaited<ReturnType<typeof setupApiMocks>>) {
  state.travels.push({ ...TEST_TRAVEL });
}

/**
 * Create a minimal 1x1 JPEG file for testing file upload.
 */
function createTestImagePath(): string {
  const tmpDir = path.join(__dirname, '.tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const filePath = path.join(tmpDir, 'test-avatar.jpg');
  if (!fs.existsSync(filePath)) {
    // Minimal valid JPEG: 1x1 pixel
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
      0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
      0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
      0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
      0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
      0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
      0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
      0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
      0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
      0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
      0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
      0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
      0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
      0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
      0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
      0x00, 0x00, 0x3f, 0x00, 0x7b, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0xff,
      0xd9,
    ]);
    fs.writeFileSync(filePath, jpegBuffer);
  }
  return filePath;
}

// ─── Test: Upload Flow ───────────────────────────────────────────────────────

test.describe('Avatar upload flow', () => {
  test('clicking avatar opens upload modal and selecting file shows cropper', async ({ page }) => {
    const state = await setupAuthenticated(page);

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Click avatar to open upload modal
    await page.locator('[data-testid="profile-avatar"]').click();
    await expect(page.locator('[data-testid="avatar-upload-modal"]')).toBeVisible();

    // Click "Upload photo" to trigger file picker
    const fileInput = page.locator('[data-testid="avatar-file-input"]');
    const testImagePath = createTestImagePath();
    await fileInput.setInputFiles(testImagePath);

    // Cropper should now be visible (react-easy-crop renders with class reactEasyCrop_Container)
    await expect(page.locator('[data-testid="avatar-upload-modal"]')).toBeVisible();

    // Confirm button should be visible when image is loaded
    await expect(page.locator('[data-testid="crop-confirm-button"]')).toBeVisible();

    // Click confirm to upload
    await page.locator('[data-testid="crop-confirm-button"]').click();

    // After successful upload, modal closes and avatar should update
    // The state should now have the avatar URL set
    await expect(async () => {
      expect(state.user.avatarUrl).toBe(TEST_AVATAR_URL);
    }).toPass({ timeout: 5000 });
  });
});

// ─── Test: Remove Flow ───────────────────────────────────────────────────────

test.describe('Avatar remove flow', () => {
  test('remove photo button reverts avatar to initial', async ({ page }) => {
    const state = await setupAuthenticated(page);

    // Set avatar in state before navigating
    state.user = { ...state.user, avatarUrl: TEST_AVATAR_URL };

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // "Remove photo" button should be visible
    await expect(page.locator('[data-testid="remove-photo-button"]')).toBeVisible();

    // Click remove photo
    await page.locator('[data-testid="remove-photo-button"]').click();

    // State should revert to null
    await expect(async () => {
      expect(state.user.avatarUrl).toBeNull();
    }).toPass({ timeout: 5000 });
  });

  test('remove photo button is not visible when no avatar is set', async ({ page }) => {
    await setupAuthenticated(page);

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // No remove button when avatarUrl is null
    await expect(page.locator('[data-testid="remove-photo-button"]')).not.toBeVisible();
  });
});

// ─── Test: Cancel Crop ───────────────────────────────────────────────────────

test.describe('Avatar cancel crop', () => {
  test('cancelling crop closes modal without changes', async ({ page }) => {
    const state = await setupAuthenticated(page);

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Open upload modal
    await page.locator('[data-testid="profile-avatar"]').click();
    await expect(page.locator('[data-testid="avatar-upload-modal"]')).toBeVisible();

    // Click cancel
    await page.locator('[data-testid="crop-cancel-button"]').click();

    // Modal should close
    await expect(page.locator('[data-testid="avatar-upload-modal"]')).not.toBeVisible();

    // Avatar should remain unchanged
    expect(state.user.avatarUrl).toBeNull();
  });
});

// ─── Test: Upload Error ──────────────────────────────────────────────────────

test.describe('Avatar upload error', () => {
  test('shows error message when upload fails', async ({ page }) => {
    await setupAuthenticated(page);

    // Override the avatar upload handler to return an error
    await page.route(/localhost:3000\/users\/me\/avatar/, async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Upload failed' }),
        });
      }
      return route.fallback();
    });

    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Open modal and select file
    await page.locator('[data-testid="profile-avatar"]').click();
    const fileInput = page.locator('[data-testid="avatar-file-input"]');
    const testImagePath = createTestImagePath();
    await fileInput.setInputFiles(testImagePath);

    // Wait for cropper and confirm
    await expect(page.locator('[data-testid="crop-confirm-button"]')).toBeVisible();
    await page.locator('[data-testid="crop-confirm-button"]').click();

    // Error message should appear
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
  });
});

// ─── Test: Avatar Display on Dashboard ───────────────────────────────────────

test.describe('Avatar display on dashboard', () => {
  test('dashboard header shows avatar image when user has avatarUrl', async ({ page }) => {
    const state = await setupAuthenticated(page);
    addTravelToState(state);

    // Set avatar URL before navigating
    state.user = { ...state.user, avatarUrl: TEST_AVATAR_URL };

    // Navigate to a travel's dashboard
    await page.goto(`/travels/${TRAVEL_ID}`);

    // Wait for dashboard to load
    await expect(page.locator('[data-testid="header-avatar"]').or(page.locator('[data-testid="dashboard-skeleton"]'))).toBeVisible();

    // The header avatar should contain an img with the avatar URL (via UserAvatar)
    const headerAvatar = page.locator('[data-testid="header-avatar"]');
    await expect(headerAvatar).toBeVisible({ timeout: 10000 });
  });
});
