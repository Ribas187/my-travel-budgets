import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { setupApiMocks, authenticatePage } from './mocks/handlers';
import { TEST_TOKEN, TRAVEL_ID, CAT_FOOD_ID } from './mocks/fixtures';

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

function addCategoryToState(
  state: Awaited<ReturnType<typeof setupApiMocks>>,
  overrides: Partial<{
    id: string;
    name: string;
    icon: string;
    color: string;
    budgetLimit: number | null;
  }> = {},
) {
  const category = {
    id: CAT_FOOD_ID,
    travelId: TRAVEL_ID,
    name: 'Food & Drinks',
    icon: '🍔',
    color: '#F59E0B',
    budgetLimit: 500,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
  state.categories.push(category);
  state.travelDetail = {
    ...state.travelDetail,
    categories: state.categories as typeof state.travelDetail.categories,
  };
  return category;
}

// ─── Create Category Flow ───────────────────────────────────────────────────

test.describe('Create category with pickers', () => {
  test('should create category with selected emoji and color', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);

    await page.goto(`/travels/${TRAVEL_ID}/categories`);
    await page.waitForSelector(
      '[data-testid="categories-empty-state"], [data-testid="add-category-btn"]',
    );

    // Click add category
    await page
      .locator('[data-testid="add-category-btn"], [data-testid="empty-state-cta"]')
      .first()
      .click();

    // Fill name and budget
    await page.locator('[data-testid="category-name-input"]').fill('Cafes');
    await page.locator('[data-testid="category-budget-input"]').fill('200');

    // Select a specific emoji (☕ - in the Food & Drink group)
    const coffeeEmoji = page.getByRole('radio', { name: '☕' });
    await coffeeEmoji.click();

    // Select a specific color (Blue)
    const blueColor = page.getByRole('radio', { name: 'Blue' });
    await blueColor.click();

    // Verify live preview shows the selected emoji
    const preview = page.locator('[data-testid="category-live-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('☕');

    // Save
    await page.locator('[data-testid="category-save-btn"]').click();

    // Verify category was created with correct icon and color
    await expect(async () => {
      expect(state.categories.length).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
    expect(state.categories[0]?.name).toBe('Cafes');
    expect(state.categories[0]?.icon).toBe('☕');
    expect(state.categories[0]?.color).toBe('#3182CE');
  });
});

// ─── Edit Category Flow ─────────────────────────────────────────────────────

test.describe('Edit category with pickers', () => {
  test('should edit category icon and color', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    addCategoryToState(state);

    await page.goto(`/travels/${TRAVEL_ID}/categories`);
    await page.waitForSelector('[data-testid="add-category-btn"]');

    // Click the existing category to expand it
    await page.getByText('Food & Drinks').click();

    // Wait for form to appear
    await expect(page.locator('[data-testid="category-name-input"]')).toBeVisible();

    // Change emoji to pizza
    const pizzaEmoji = page.getByRole('radio', { name: '🍕' });
    await pizzaEmoji.click();

    // Change color to Green
    const greenColor = page.getByRole('radio', { name: 'Green' });
    await greenColor.click();

    // Save
    await page.locator('[data-testid="category-save-btn"]').click();

    // Verify the update was sent
    await expect(async () => {
      const updated = state.categories.find((c) => c.id === CAT_FOOD_ID);
      expect(updated?.icon).toBe('🍕');
      expect(updated?.color).toBe('#38A169');
    }).toPass({ timeout: 5000 });
  });
});

// ─── Backward Compatibility ─────────────────────────────────────────────────

test.describe('Backward compatibility', () => {
  test('should handle category with non-curated icon and color', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page);
    // Add category with values NOT in the curated sets
    addCategoryToState(state, {
      id: 'cat-legacy',
      name: 'Legacy Category',
      icon: '🎯',
      color: '#ABCDEF',
      budgetLimit: null,
    });

    await page.goto(`/travels/${TRAVEL_ID}/categories`);
    await page.waitForSelector('[data-testid="add-category-btn"]');

    // Click the legacy category to expand
    await page.getByText('Legacy Category').click();

    // Wait for form
    await expect(page.locator('[data-testid="category-name-input"]')).toBeVisible();

    // The form should be editable — change the name and save
    await page.locator('[data-testid="category-name-input"]').clear();
    await page.locator('[data-testid="category-name-input"]').fill('Updated Legacy');

    // Save without changing icon/color
    await page.locator('[data-testid="category-save-btn"]').click();

    // Verify the update preserves the non-curated icon and color
    await expect(async () => {
      const updated = state.categories.find((c) => c.id === 'cat-legacy');
      expect(updated?.name).toBe('Updated Legacy');
      expect(updated?.icon).toBe('🎯');
      expect(updated?.color).toBe('#ABCDEF');
    }).toPass({ timeout: 5000 });
  });
});
