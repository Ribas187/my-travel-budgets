/**
 * Playwright route handlers that intercept API requests.
 *
 * Uses Playwright's page.route() to intercept only API calls (localhost:3000).
 * All patterns are scoped to the API origin to avoid intercepting Vite dev server requests.
 */
import type { Page } from '@playwright/test'
import {
  TEST_AUTH_SESSION,
  TEST_TRAVEL,
  TEST_TRAVEL_DETAIL,
  TEST_CATEGORY_FOOD,
  TEST_EXPENSE,
  TEST_DASHBOARD,
  TRAVEL_ID,
} from './fixtures'

interface MockState {
  travels: typeof TEST_TRAVEL[]
  travelDetail: typeof TEST_TRAVEL_DETAIL
  categories: typeof TEST_CATEGORY_FOOD[]
  expenses: typeof TEST_EXPENSE[]
}

/** Only intercept requests going to the API origin */
function isApiRequest(url: string): boolean {
  return url.includes('localhost:3000') || url.includes('api.mybudget.cards')
}

/**
 * Sets up all API route mocks on the given Playwright page.
 * Returns a mutable state object so tests can modify responses dynamically.
 */
export async function setupApiMocks(page: Page): Promise<MockState> {
  const state: MockState = {
    travels: [],
    travelDetail: { ...TEST_TRAVEL_DETAIL },
    categories: [],
    expenses: [],
  }

  // Single catch-all route for the API origin
  await page.route(/localhost:3000/, async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    const pathname = new URL(url).pathname

    // ── Auth: magic link ──
    if (pathname === '/auth/magic-link' && method === 'POST') {
      return route.fulfill({
        status: 202,
        headers: { 'content-length': '0' },
        body: '',
      })
    }

    // ── Auth: verify ──
    if (pathname === '/auth/verify' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_AUTH_SESSION),
      })
    }

    // ── Dashboard ──
    const dashboardMatch = pathname.match(/^\/travels\/([^/]+)\/dashboard$/)
    if (dashboardMatch && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_DASHBOARD),
      })
    }

    // ── Expenses ──
    const expensesMatch = pathname.match(/^\/travels\/([^/]+)\/expenses/)
    if (expensesMatch) {
      if (method === 'GET') {
        const urlObj = new URL(url)
        const categoryFilter = urlObj.searchParams.get('categoryId')
        const filtered = categoryFilter
          ? state.expenses.filter((e) => e.categoryId === categoryFilter)
          : state.expenses
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filtered),
        })
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON()
        const newExpense = {
          ...TEST_EXPENSE,
          ...body,
          id: `expense-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        state.expenses.push(newExpense)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newExpense),
        })
      }
      return route.fallback()
    }

    // ── Categories ──
    const categoriesMatch = pathname.match(/^\/travels\/([^/]+)\/categories/)
    if (categoriesMatch) {
      if (method === 'POST') {
        const body = route.request().postDataJSON()
        const newCategory = {
          ...TEST_CATEGORY_FOOD,
          ...body,
          id: `cat-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        state.categories.push(newCategory)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newCategory),
        })
      }
      if (method === 'PATCH') {
        const body = route.request().postDataJSON()
        const catMatch = pathname.match(/\/categories\/([^/]+)$/)
        if (catMatch) {
          const catId = catMatch[1]
          const idx = state.categories.findIndex((c) => c.id === catId)
          if (idx >= 0) {
            state.categories[idx] = { ...state.categories[idx]!, ...body }
          }
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        })
      }
      if (method === 'DELETE') {
        const catMatch = pathname.match(/\/categories\/([^/]+)$/)
        if (catMatch) {
          const catId = catMatch[1]
          state.categories = state.categories.filter((c) => c.id !== catId)
        }
        return route.fulfill({ status: 204, body: '' })
      }
      return route.fallback()
    }

    // ── Members ──
    const membersMatch = pathname.match(/^\/travels\/([^/]+)\/members/)
    if (membersMatch) {
      if (method === 'POST') {
        const body = route.request().postDataJSON()
        const newMember = {
          id: `member-${Date.now()}`,
          travelId: membersMatch[1],
          userId: null,
          guestName: body.guestName ?? null,
          role: 'member' as const,
          user: body.email
            ? {
                id: `user-${Date.now()}`,
                email: body.email,
                name: body.email.split('@')[0],
                avatarUrl: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        state.travelDetail.members.push(newMember as any)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newMember),
        })
      }
      if (method === 'DELETE') {
        return route.fulfill({ status: 204, body: '' })
      }
      return route.fallback()
    }

    // ── Travels: exact /travels path (list + create) ──
    if (pathname === '/travels') {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.travels),
        })
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON()
        const newTravel = {
          ...TEST_TRAVEL,
          ...body,
          id: `travel-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        state.travels.push(newTravel)
        state.travelDetail = {
          ...newTravel,
          members: [TEST_TRAVEL_DETAIL.members[0]!],
          categories: state.categories,
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newTravel),
        })
      }
      return route.fallback()
    }

    // ── Travels: detail /travels/:id (get, update, delete) ──
    const travelDetailMatch = pathname.match(/^\/travels\/([^/]+)$/)
    if (travelDetailMatch) {
      const travelId = travelDetailMatch[1]
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...state.travelDetail,
            categories: state.categories,
          }),
        })
      }
      if (method === 'PATCH') {
        const body = route.request().postDataJSON()
        const updatedTravel = {
          ...state.travelDetail,
          ...body,
          updatedAt: new Date().toISOString(),
        }
        state.travelDetail = updatedTravel
        const idx = state.travels.findIndex((t) => t.id === travelId)
        if (idx >= 0) {
          state.travels[idx] = { ...state.travels[idx]!, ...body }
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedTravel),
        })
      }
      if (method === 'DELETE') {
        state.travels = state.travels.filter((t) => t.id !== travelId)
        return route.fulfill({ status: 204, body: '' })
      }
      return route.fallback()
    }

    // Unhandled API request — let it through (will likely 404)
    return route.fallback()
  })

  return state
}

/**
 * Authenticate the page by setting the auth token in localStorage.
 */
export async function authenticatePage(page: Page, token: string) {
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t)
  }, token)
}
