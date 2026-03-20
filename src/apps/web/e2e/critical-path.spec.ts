import { test, expect } from '@playwright/test'
import { setupApiMocks, authenticatePage } from './mocks/handlers'
import {
  TEST_TOKEN,
  TRAVEL_ID,
  CAT_FOOD_ID,
  CAT_TRANSPORT_ID,
  MEMBER_ID,
} from './mocks/fixtures'

// Helper to set up an authenticated page with a travel and categories
async function setupAuthenticatedWithTravel(page: import('@playwright/test').Page) {
  const state = await setupApiMocks(page)
  await page.goto('/')
  await authenticatePage(page, TEST_TOKEN)

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
  })

  return state
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
  )
  state.travelDetail = {
    ...state.travelDetail,
    categories: state.categories as any,
  }
}

// ─── Login Flow ──────────────────────────────────────────────────────────────

test.describe('Login flow', () => {
  test('should enter email, submit, and see check-email confirmation', async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/login')

    // Enter email
    const emailInput = page.locator('#login-email')
    await emailInput.fill('test@example.com')

    // Submit magic link
    await page.getByRole('button', { name: /send magic link/i }).click()

    // Should show "Check your email" confirmation
    await expect(page.getByText(/check your email/i)).toBeVisible()
    await expect(page.getByText('test@example.com')).toBeVisible()
  })

  test('should verify magic link token and redirect to travels', async ({ page }) => {
    await setupApiMocks(page)

    // Navigate to verify with a token
    await page.goto('/auth/verify?token=valid-test-token')

    // Should redirect to /travels after successful verification
    await page.waitForURL('**/travels**')
    await expect(page).toHaveURL(/\/travels/)
  })
})

// ─── Create Travel ───────────────────────────────────────────────────────────

test.describe('Create travel', () => {
  test('should fill form and create a new trip', async ({ page }) => {
    const state = await setupApiMocks(page)

    // Authenticate
    await page.goto('/')
    await authenticatePage(page, TEST_TOKEN)
    await page.goto('/travels')

    // Wait for empty state or list to load
    await page.waitForSelector('[data-testid="travels-empty-state"], [data-testid="travels-list"]')

    // Navigate to create new trip
    await page.goto('/travels/new')

    // Fill the trip form
    await page.locator('[data-testid="trip-name-input"]').fill('Summer in Europe')
    await page.locator('[data-testid="trip-destination-input"]').fill('Paris, Rome, Barcelona')
    await page.locator('[data-testid="trip-start-date-input"]').fill('2026-06-01')
    await page.locator('[data-testid="trip-end-date-input"]').fill('2026-06-15')

    // Select currency
    await page.locator('[data-testid="trip-currency-select"]').click()
    await page.locator('[data-testid="currency-option-EUR"]').click()

    // Set budget
    await page.locator('[data-testid="trip-budget-input"]').fill('3000')

    // Save
    await page.locator('[data-testid="save-trip-button"]').click()

    // After creation, the app navigates to the travel detail page
    await page.waitForURL(/\/travels\/travel-/)

    // The travel should now be in the state
    expect(state.travels.length).toBeGreaterThan(0)
    expect(state.travels[0]?.name).toBe('Summer in Europe')
  })
})

// ─── Add Category ────────────────────────────────────────────────────────────

test.describe('Add category', () => {
  test('should add a new category to a travel', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)

    // Navigate to categories page
    await page.goto(`/travels/${TRAVEL_ID}/categories`)

    // Wait for page to load
    await page.waitForSelector('[data-testid="categories-empty-state"], [data-testid="add-category-btn"]')

    // Click add category
    await page.locator('[data-testid="add-category-btn"], [data-testid="empty-state-cta"]').first().click()

    // Fill category form
    await page.locator('[data-testid="category-name-input"]').fill('Food & Drinks')
    await page.locator('[data-testid="category-budget-input"]').fill('500')

    // Select an icon preset (first one is already selected by default — 🍔)
    await page.locator('[data-testid="icon-preset-0"]').click()

    // Save
    await page.locator('[data-testid="category-save-btn"]').click()

    // Verify category was created in mock state
    await expect(async () => {
      expect(state.categories.length).toBeGreaterThan(0)
    }).toPass({ timeout: 5000 })
    expect(state.categories[0]?.name).toBe('Food & Drinks')
  })
})

// ─── Add Expense ─────────────────────────────────────────────────────────────

test.describe('Add expense', () => {
  test('should open expense modal, fill form, and save', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)

    // Navigate to expenses page (inside travel tabs)
    await page.goto(`/travels/${TRAVEL_ID}/expenses`)
    await page.waitForSelector('[data-testid="expense-list-container"]')

    // Open add expense modal — click the "Add Expense" button (works for both viewports)
    const addButton = page.getByRole('button', { name: /add expense/i })
    await addButton.first().click()

    // Wait for modal to appear
    await page.waitForSelector('[data-testid="add-expense-modal"]')

    // Fill amount: the input is a hidden overlay (opacity:0) positioned absolutely.
    // On mobile it can be outside the viewport. Focus it programmatically and type.
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement
      input?.focus()
    })
    await page.keyboard.type('42.50', { delay: 30 })

    // Fill description
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="description-input"]') as HTMLInputElement
      input?.scrollIntoView({ block: 'center' })
      input?.focus()
    })
    await page.keyboard.type('Lunch at bistro', { delay: 10 })

    // Select a category (Food & Drinks)
    await page.locator('[data-testid="category-chips"]').getByText('Food & Drinks').click()

    // Payer is already selected (first member by default)

    // Wait for form validation to settle
    await page.waitForTimeout(500)

    // Click save
    await page.locator('[data-testid="save-expense-button"]').click({ force: true })

    // Verify expense was created
    await expect(async () => {
      expect(state.expenses.length).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })
    expect(state.expenses[0]?.description).toBe('Lunch at bistro')
  })
})

// ─── Expense List ────────────────────────────────────────────────────────────

test.describe('Expense list', () => {
  test('should display expenses grouped by day', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)

    state.expenses.push(
      {
        id: 'expense-1',
        travelId: TRAVEL_ID,
        categoryId: CAT_FOOD_ID,
        memberId: MEMBER_ID,
        amount: 42.5,
        description: 'Lunch at bistro',
        date: '2026-06-02',
        createdAt: '2026-06-02T12:30:00.000Z',
        updatedAt: '2026-06-02T12:30:00.000Z',
      },
      {
        id: 'expense-2',
        travelId: TRAVEL_ID,
        categoryId: CAT_TRANSPORT_ID,
        memberId: MEMBER_ID,
        amount: 15.0,
        description: 'Metro tickets',
        date: '2026-06-02',
        createdAt: '2026-06-02T14:00:00.000Z',
        updatedAt: '2026-06-02T14:00:00.000Z',
      },
    )

    await page.goto(`/travels/${TRAVEL_ID}/expenses`)
    await page.waitForSelector('[data-testid="expense-list-container"]')

    // Verify expenses are displayed
    await expect(page.getByText('Lunch at bistro')).toBeVisible()
    await expect(page.getByText('Metro tickets')).toBeVisible()
  })

  test('should filter expenses by category', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)

    state.expenses.push(
      {
        id: 'expense-1',
        travelId: TRAVEL_ID,
        categoryId: CAT_FOOD_ID,
        memberId: MEMBER_ID,
        amount: 42.5,
        description: 'Lunch at bistro',
        date: '2026-06-02',
        createdAt: '2026-06-02T12:30:00.000Z',
        updatedAt: '2026-06-02T12:30:00.000Z',
      },
      {
        id: 'expense-2',
        travelId: TRAVEL_ID,
        categoryId: CAT_TRANSPORT_ID,
        memberId: MEMBER_ID,
        amount: 15.0,
        description: 'Metro tickets',
        date: '2026-06-02',
        createdAt: '2026-06-02T14:00:00.000Z',
        updatedAt: '2026-06-02T14:00:00.000Z',
      },
    )

    await page.goto(`/travels/${TRAVEL_ID}/expenses`)
    await page.waitForSelector('[data-testid="expense-list-container"]')

    // Both expenses should be visible initially
    await expect(page.getByText('Lunch at bistro')).toBeVisible()
    await expect(page.getByText('Metro tickets')).toBeVisible()

    // Click on "Food & Drinks" filter chip in filter bar
    const filterBar = page.locator('[data-testid="filter-bar"]')
    await filterBar.getByText('Food & Drinks').click()

    // After filtering, only food expense should remain
    await expect(page.getByText('Lunch at bistro')).toBeVisible()
    await expect(page.getByText('Metro tickets')).not.toBeVisible({ timeout: 5000 })
  })

  test('should search expenses by description', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)

    state.expenses.push(
      {
        id: 'expense-1',
        travelId: TRAVEL_ID,
        categoryId: CAT_FOOD_ID,
        memberId: MEMBER_ID,
        amount: 42.5,
        description: 'Lunch at bistro',
        date: '2026-06-02',
        createdAt: '2026-06-02T12:30:00.000Z',
        updatedAt: '2026-06-02T12:30:00.000Z',
      },
      {
        id: 'expense-2',
        travelId: TRAVEL_ID,
        categoryId: CAT_FOOD_ID,
        memberId: MEMBER_ID,
        amount: 8.0,
        description: 'Coffee at hotel',
        date: '2026-06-02',
        createdAt: '2026-06-02T09:00:00.000Z',
        updatedAt: '2026-06-02T09:00:00.000Z',
      },
    )

    await page.goto(`/travels/${TRAVEL_ID}/expenses`)
    await page.waitForSelector('[data-testid="expense-list-container"]')

    // Both visible initially
    await expect(page.getByText('Lunch at bistro')).toBeVisible()
    await expect(page.getByText('Coffee at hotel')).toBeVisible()

    // Open search
    await page.locator('[data-testid="search-toggle"]').click()
    await page.locator('[data-testid="search-input"]').fill('bistro')

    // Wait for debounce + re-render
    await expect(page.getByText('Lunch at bistro')).toBeVisible()
    await expect(page.getByText('Coffee at hotel')).not.toBeVisible({ timeout: 5000 })
  })
})

// ─── Edit Trip ───────────────────────────────────────────────────────────────

test.describe('Edit trip', () => {
  test('should navigate to edit, change name, and save', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)

    // Navigate to edit trip page
    await page.goto(`/travels/${TRAVEL_ID}/edit`)

    // Wait for the form to load with existing data
    await page.waitForSelector('[data-testid="trip-form"]')

    // Verify name is pre-filled
    const nameInput = page.locator('[data-testid="trip-name-input"]')
    await expect(nameInput).toHaveValue('Summer in Europe')

    // Change the name
    await nameInput.clear()
    await nameInput.fill('Winter in Japan')

    // Save
    await page.locator('[data-testid="save-trip-button"]').click()

    // Should navigate back to travel detail
    await page.waitForURL(`**/travels/${TRAVEL_ID}`)
  })
})

// ─── Delete Trip ─────────────────────────────────────────────────────────────

test.describe('Delete trip', () => {
  test('should delete trip with confirmation dialog', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)

    // Navigate to edit trip
    await page.goto(`/travels/${TRAVEL_ID}/edit`)
    await page.waitForSelector('[data-testid="trip-form"]')

    // Click delete trip button
    await page.locator('[data-testid="delete-trip-button"]').click()

    // Confirmation dialog should appear
    await page.waitForSelector('[data-testid="delete-trip-dialog"]')
    await expect(page.locator('[data-testid="delete-trip-dialog"]')).toBeVisible()

    // Confirm deletion
    await page.locator('[data-testid="delete-trip-confirm"]').click()

    // Should redirect to travels list
    await page.waitForURL('**/travels')

    // Travel should be removed from state
    expect(state.travels.length).toBe(0)
  })
})
