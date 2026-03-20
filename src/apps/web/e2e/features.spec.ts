import { test, expect } from '@playwright/test'
import { setupApiMocks, authenticatePage } from './mocks/handlers'
import {
  TEST_TOKEN,
  TRAVEL_ID,
  CAT_FOOD_ID,
  CAT_TRANSPORT_ID,
  MEMBER_ID,
  EXPENSE_ID,
  EXPENSE_ID_2,
  TEST_EXPENSE,
  TEST_EXPENSE_2,
  TEST_DASHBOARD,
} from './mocks/fixtures'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function addExpensesToState(state: Awaited<ReturnType<typeof setupApiMocks>>) {
  state.expenses.push(
    { ...TEST_EXPENSE },
    { ...TEST_EXPENSE_2 },
  )
}

// ─── Test 1: Navigation Flow ────────────────────────────────────────────────

test.describe('Navigation flow', () => {
  test('bottom nav tabs work and FAB opens add expense modal', async ({ page, browserName }, testInfo) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)
    addExpensesToState(state)

    const isMobile = testInfo.project.name === 'mobile'

    await page.goto(`/travels/${TRAVEL_ID}`)

    if (isMobile) {
      // Verify bottom nav is visible
      await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible()

      // Click Expenses tab
      await page.getByRole('tab', { name: /expenses/i }).click()
      await page.waitForURL(`**/travels/${TRAVEL_ID}/expenses`)
      await expect(page.locator('[data-testid="expense-list-container"]')).toBeVisible()

      // Budget tab is replaced by FAB on mobile — skip it

      // Click Group tab
      await page.getByRole('tab', { name: /group/i }).click()
      await page.waitForURL(`**/travels/${TRAVEL_ID}/members`)
      await expect(page.locator('[data-testid="members-page"]')).toBeVisible()

      // Click Home tab
      await page.getByRole('tab', { name: /home/i }).click()
      await page.waitForURL(new RegExp(`/travels/${TRAVEL_ID}$`))
      await expect(page.locator('[data-testid="dashboard-mobile"]')).toBeVisible()

      // FAB opens add expense modal
      await page.locator('[data-testid="fab-button"]').click()
      await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible()
    } else {
      // Desktop: verify sidebar is visible
      await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible()

      // Click Expenses nav item
      await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /expenses/i }).click()
      await page.waitForURL(`**/travels/${TRAVEL_ID}/expenses`)
      await expect(page.locator('[data-testid="expense-list-container"]')).toBeVisible()

      // Click Budget nav item
      await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /budget/i }).click()
      await page.waitForURL(`**/travels/${TRAVEL_ID}/budget`)
      await expect(page.locator('[data-testid="budget-breakdown-page"]')).toBeVisible()

      // Click Group nav item
      await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /group/i }).click()
      await page.waitForURL(`**/travels/${TRAVEL_ID}/members`)
      await expect(page.locator('[data-testid="members-page"]')).toBeVisible()

      // Click Dashboard nav item
      await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /home/i }).click()
      await page.waitForURL(new RegExp(`/travels/${TRAVEL_ID}$`))
      await expect(page.locator('[data-testid="dashboard-desktop"]')).toBeVisible()

      // FAB: use "Add expense" button in sidebar
      await page.locator('[data-testid="desktop-sidebar"]').getByRole('button', { name: /add expense/i }).click()
      await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible()
    }
  })
})

// ─── Test 2: Dashboard ──────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test('shows budget ring, category progress, and recent expenses', async ({ page }, testInfo) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)
    addExpensesToState(state)

    const isMobile = testInfo.project.name === 'mobile'

    await page.goto(`/travels/${TRAVEL_ID}`)

    if (isMobile) {
      await expect(page.locator('[data-testid="dashboard-mobile"]')).toBeVisible()

      // Budget ring is shown on mobile
      await expect(page.locator('[data-testid="budget-ring"]')).toBeVisible()
    } else {
      await expect(page.locator('[data-testid="dashboard-desktop"]')).toBeVisible()

      // Desktop shows stat card row instead of budget ring
      await expect(page.locator('[data-testid="stat-card-row"]')).toBeVisible()
    }

    // Category progress rows
    await expect(page.locator('[data-testid="category-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-progress-row"]')).toHaveCount(2)

    // Recent expenses section
    await expect(page.locator('[data-testid="recent-expenses"]')).toBeVisible()
  })
})

// ─── Test 3: Budget Breakdown ───────────────────────────────────────────────

test.describe('Budget Breakdown', () => {
  test('shows summary card, category details, and pacing text', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)
    addExpensesToState(state)

    await page.goto(`/travels/${TRAVEL_ID}/budget`)

    // Budget breakdown page renders
    await expect(page.locator('[data-testid="budget-breakdown-page"]')).toBeVisible()

    // Summary card with totals
    await expect(page.locator('[data-testid="budget-summary-card"]')).toBeVisible()

    // Stacked bar
    await expect(page.locator('[data-testid="stacked-bar"]')).toBeVisible()

    // Color legend
    await expect(page.locator('[data-testid="color-legend"]')).toBeVisible()

    // Category detail cards
    await expect(page.locator('[data-testid="category-detail-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-detail-card"]')).toHaveCount(2)

    // Pacing text should be visible (e.g. "On track" or "Over budget")
    await expect(page.locator('[data-testid="pacing-text"]').first()).toBeVisible()
  })
})

// ─── Test 4: Expense Edit & Delete ──────────────────────────────────────────

test.describe('Expense edit and delete', () => {
  test('edit modal pre-fills and saves; delete removes from list', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)
    addExpensesToState(state)

    await page.goto(`/travels/${TRAVEL_ID}/expenses`)
    await page.waitForSelector('[data-testid="expense-list-container"]')

    // Click the first expense row to open edit modal
    await page.locator(`[data-testid="expense-row-pressable-${EXPENSE_ID}"]`).click()
    await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible()

    // Verify description is pre-filled
    await expect(async () => {
      const descValue = await page.locator('[data-testid="description-input"]').inputValue()
      expect(descValue).toBe('Lunch at bistro')
    }).toPass({ timeout: 5000 })

    // Change the amount: clear and type new value
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement
      input?.focus()
      input.value = ''
    })
    await page.locator('[data-testid="amount-input"]').fill('')
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="amount-input"]') as HTMLInputElement
      input?.focus()
    })
    await page.keyboard.type('55.00', { delay: 30 })

    // Save
    await page.locator('[data-testid="save-expense-button"]').click({ force: true })

    // Wait for modal to close
    await expect(page.locator('[data-testid="add-expense-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Verify the expense was updated in state
    await expect(async () => {
      const updatedExpense = state.expenses.find((e) => e.id === EXPENSE_ID)
      expect(updatedExpense?.amount).toBe(55)
    }).toPass({ timeout: 5000 })

    // Now test delete: click the second expense
    await page.locator(`[data-testid="expense-row-pressable-${EXPENSE_ID_2}"]`).click()
    await expect(page.locator('[data-testid="add-expense-modal"]')).toBeVisible()

    // Click delete button
    await page.locator('[data-testid="delete-expense-button"]').click({ force: true })

    // Confirm deletion
    await expect(page.locator('[data-testid="delete-expense-dialog"]')).toBeVisible()
    await page.locator('[data-testid="delete-confirm"]').click({ force: true })

    // Modal should close and expense removed from state
    await expect(page.locator('[data-testid="delete-expense-dialog"]')).not.toBeVisible({ timeout: 5000 })
    await expect(async () => {
      const deletedExpense = state.expenses.find((e) => e.id === EXPENSE_ID_2)
      expect(deletedExpense).toBeUndefined()
    }).toPass({ timeout: 5000 })
  })
})

// ─── Test 5: Members Page ───────────────────────────────────────────────────

test.describe('Members page', () => {
  test('shows member list, invite adds member, remove deletes member', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)

    await page.goto(`/travels/${TRAVEL_ID}/members`)
    await expect(page.locator('[data-testid="members-page"]')).toBeVisible()

    // Verify member list shows the owner
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="member-row"]')).toHaveCount(1)
    await expect(page.getByText('Test User')).toBeVisible()

    // Click "Add Member" button
    await page.getByRole('button', { name: /add member/i }).click()

    // Fill email in invite form (InviteMemberForm uses Tamagui's testID prop)
    await expect(page.locator('[data-testid="invite-member-form"]')).toBeVisible()
    await page.locator('[data-testid="invite-member-input"]').fill('friend@example.com')

    // Submit invite — click the "Add Member" button inside the form
    await page.locator('[data-testid="invite-member-form"]').getByRole('button', { name: /add member/i }).click()

    // Verify new member appears
    await expect(async () => {
      expect(state.travelDetail.members.length).toBe(2)
    }).toPass({ timeout: 5000 })

    // Reload to see updated member list
    await page.goto(`/travels/${TRAVEL_ID}/members`)
    await expect(page.locator('[data-testid="member-row"]')).toHaveCount(2)

    // Remove the second member (non-owner)
    await page.locator('[data-testid="remove-member-button"]').click()

    // Confirm removal
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible()
    await page.locator('[data-testid="confirm-remove"]').click()

    // Wait for removal to complete
    await expect(page.locator('[data-testid="confirm-dialog"]')).not.toBeVisible({ timeout: 5000 })
  })
})

// ─── Test 6: Profile Page ───────────────────────────────────────────────────

test.describe('Profile page', () => {
  test('shows user info, language switch changes text, logout redirects', async ({ page }) => {
    const state = await setupAuthenticatedWithTravel(page)

    await page.goto('/profile')
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible()

    // Verify name and email displayed
    await expect(page.getByRole('heading', { name: 'Test User' })).toBeVisible()
    await expect(page.getByText('test@example.com')).toBeVisible()

    // Verify avatar
    await expect(page.locator('[data-testid="profile-avatar"]')).toBeVisible()

    // Switch language to pt-BR
    await page.locator('[data-testid="language-pt-br"]').click()

    // Verify UI text changes to Portuguese (the profile title changes)
    await expect(page.getByText('Perfil')).toBeVisible()

    // Switch back to English
    await page.locator('[data-testid="language-en"]').click()
    await expect(page.getByText('Profile')).toBeVisible()

    // Click logout
    await page.locator('[data-testid="logout-button"]').click()

    // Verify redirect to login page
    await page.waitForURL('**/login**')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Test 7: Desktop Layout ────────────────────────────────────────────────

test.describe('Desktop layout', () => {
  test('sidebar renders with navigation, two-column dashboard layout', async ({ page }, testInfo) => {
    // This test only makes sense in desktop viewport
    if (testInfo.project.name === 'mobile') {
      test.skip()
      return
    }

    const state = await setupAuthenticatedWithTravel(page)
    addCategoriesToState(state)
    addExpensesToState(state)

    await page.goto(`/travels/${TRAVEL_ID}`)

    // Desktop shell is rendered
    await expect(page.locator('[data-testid="app-shell-desktop"]')).toBeVisible()

    // Sidebar renders instead of bottom nav
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="bottom-nav"]')).not.toBeVisible()

    // Two-column dashboard layout
    await expect(page.locator('[data-testid="dashboard-desktop"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-card-row"]')).toBeVisible()

    // Sidebar navigation works — click each item
    await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /expenses/i }).click()
    await page.waitForURL(`**/travels/${TRAVEL_ID}/expenses`)
    await expect(page.locator('[data-testid="expense-list-container"]')).toBeVisible()

    await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /budget/i }).click()
    await page.waitForURL(`**/travels/${TRAVEL_ID}/budget`)
    await expect(page.locator('[data-testid="budget-breakdown-page"]')).toBeVisible()

    await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /group/i }).click()
    await page.waitForURL(`**/travels/${TRAVEL_ID}/members`)
    await expect(page.locator('[data-testid="members-page"]')).toBeVisible()

    // Navigate back to dashboard
    await page.locator('[data-testid="desktop-sidebar"]').getByRole('link', { name: /home/i }).click()
    await page.waitForURL(new RegExp(`/travels/${TRAVEL_ID}$`))
    await expect(page.locator('[data-testid="dashboard-desktop"]')).toBeVisible()
  })
})
