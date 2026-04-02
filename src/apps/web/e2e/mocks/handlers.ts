/**
 * Playwright route handlers that intercept API requests.
 *
 * Uses Playwright's page.route() to intercept only API calls (localhost:3000).
 * All patterns are scoped to the API origin to avoid intercepting Vite dev server requests.
 */
import type { Page } from '@playwright/test';

import {
  TEST_AUTH_SESSION,
  TEST_TRAVEL,
  TEST_TRAVEL_DETAIL,
  TEST_CATEGORY_FOOD,
  TEST_EXPENSE,
  TEST_DASHBOARD,
  TEST_USER_ME,
  TEST_AVATAR_URL,
} from './fixtures';

interface PinRecord {
  email: string;
  pin: string;
  expiresAt: Date;
  usedAt: Date | null;
  attempts: number;
}

interface MockState {
  travels: (typeof TEST_TRAVEL)[];
  travelDetail: typeof TEST_TRAVEL_DETAIL;
  categories: (typeof TEST_CATEGORY_FOOD)[];
  expenses: (typeof TEST_EXPENSE)[];
  user: typeof TEST_USER_ME;
  pins: PinRecord[];
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
    user: { ...TEST_USER_ME },
    pins: [],
  };

  // Single catch-all route for the API origin
  await page.route(/localhost:3000/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;

    // ── Auth: magic link ──
    if (pathname === '/auth/magic-link' && method === 'POST') {
      return route.fulfill({
        status: 202,
        headers: { 'content-length': '0' },
        body: '',
      });
    }

    // ── Auth: request PIN ──
    if (pathname === '/auth/login-pin' && method === 'POST') {
      const body = route.request().postDataJSON();
      const pin: PinRecord = {
        email: body.email,
        pin: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        usedAt: null,
        attempts: 0,
      };
      state.pins.push(pin);
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'If your email is registered, you will receive a code.' }),
      });
    }

    // ── Auth: verify PIN ──
    if (pathname === '/auth/verify-pin' && method === 'POST') {
      const body = route.request().postDataJSON();
      const pinRecord = state.pins.find(
        (p) => p.email === body.email && p.usedAt === null,
      );

      if (!pinRecord) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid code' }),
        });
      }

      if (pinRecord.expiresAt < new Date()) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Code expired' }),
        });
      }

      if (pinRecord.pin !== body.pin) {
        pinRecord.attempts += 1;
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid code' }),
        });
      }

      pinRecord.usedAt = new Date();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_AUTH_SESSION),
      });
    }

    // ── Auth: verify ──
    if (pathname === '/auth/verify' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_AUTH_SESSION),
      });
    }

    // ── Dashboard ──
    const dashboardMatch = pathname.match(/^\/travels\/([^/]+)\/dashboard$/);
    if (dashboardMatch && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_DASHBOARD),
      });
    }

    // ── Expense: single expense PATCH/DELETE ──
    const singleExpenseMatch = pathname.match(/^\/travels\/([^/]+)\/expenses\/([^/]+)$/);
    if (singleExpenseMatch) {
      const expenseId = singleExpenseMatch[2];
      if (method === 'PATCH') {
        const body = route.request().postDataJSON();
        const idx = state.expenses.findIndex((e) => e.id === expenseId);
        if (idx >= 0) {
          state.expenses[idx] = {
            ...state.expenses[idx]!,
            ...body,
            updatedAt: new Date().toISOString(),
          };
        }
        const updated =
          idx >= 0 ? state.expenses[idx] : { ...TEST_EXPENSE, ...body, id: expenseId };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updated),
        });
      }
      if (method === 'DELETE') {
        state.expenses = state.expenses.filter((e) => e.id !== expenseId);
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fallback();
    }

    // ── Expenses ──
    const expensesMatch = pathname.match(/^\/travels\/([^/]+)\/expenses$/);
    if (expensesMatch) {
      if (method === 'GET') {
        const urlObj = new URL(url);
        const categoryFilter = urlObj.searchParams.get('categoryId');
        const filtered = categoryFilter
          ? state.expenses.filter((e) => e.categoryId === categoryFilter)
          : state.expenses;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(filtered),
        });
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newExpense = {
          ...TEST_EXPENSE,
          ...body,
          id: `expense-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.expenses.push(newExpense);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newExpense),
        });
      }
      return route.fallback();
    }

    // ── Categories ──
    const categoriesMatch = pathname.match(/^\/travels\/([^/]+)\/categories/);
    if (categoriesMatch) {
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newCategory = {
          ...TEST_CATEGORY_FOOD,
          ...body,
          id: `cat-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.categories.push(newCategory);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newCategory),
        });
      }
      if (method === 'PATCH') {
        const body = route.request().postDataJSON();
        const catMatch = pathname.match(/\/categories\/([^/]+)$/);
        if (catMatch) {
          const catId = catMatch[1];
          const idx = state.categories.findIndex((c) => c.id === catId);
          if (idx >= 0) {
            state.categories[idx] = { ...state.categories[idx]!, ...body };
          }
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      }
      if (method === 'DELETE') {
        const catMatch = pathname.match(/\/categories\/([^/]+)$/);
        if (catMatch) {
          const catId = catMatch[1];
          state.categories = state.categories.filter((c) => c.id !== catId);
        }
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fallback();
    }

    // ── Members ──
    const membersMatch = pathname.match(/^\/travels\/([^/]+)\/members/);
    if (membersMatch) {
      if (method === 'POST') {
        const body = route.request().postDataJSON();
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
        };
        state.travelDetail.members.push(newMember as (typeof state.travelDetail.members)[number]);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newMember),
        });
      }
      if (method === 'DELETE') {
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fallback();
    }

    // ── Travels: exact /travels path (list + create) ──
    if (pathname === '/travels') {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.travels),
        });
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newTravel = {
          ...TEST_TRAVEL,
          ...body,
          id: `travel-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.travels.push(newTravel);
        state.travelDetail = {
          ...newTravel,
          members: [TEST_TRAVEL_DETAIL.members[0]!],
          categories: state.categories,
        };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newTravel),
        });
      }
      return route.fallback();
    }

    // ── Travels: detail /travels/:id (get, update, delete) ──
    const travelDetailMatch = pathname.match(/^\/travels\/([^/]+)$/);
    if (travelDetailMatch) {
      const travelId = travelDetailMatch[1];
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...state.travelDetail,
            categories: state.categories,
          }),
        });
      }
      if (method === 'PATCH') {
        const body = route.request().postDataJSON();
        const updatedTravel = {
          ...state.travelDetail,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        state.travelDetail = updatedTravel;
        const idx = state.travels.findIndex((t) => t.id === travelId);
        if (idx >= 0) {
          state.travels[idx] = { ...state.travels[idx]!, ...body };
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedTravel),
        });
      }
      if (method === 'DELETE') {
        state.travels = state.travels.filter((t) => t.id !== travelId);
        if (state.user.mainTravelId === travelId) {
          state.user = { ...state.user, mainTravelId: null };
        }
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fallback();
    }

    // ── Users: avatar upload ──
    if (pathname === '/users/me/avatar' && method === 'POST') {
      state.user = { ...state.user, avatarUrl: TEST_AVATAR_URL, updatedAt: new Date().toISOString() };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.user),
      });
    }

    // ── Users: avatar remove ──
    if (pathname === '/users/me/avatar' && method === 'DELETE') {
      state.user = { ...state.user, avatarUrl: null, updatedAt: new Date().toISOString() };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.user),
      });
    }

    // ── Users: /users/me/main-travel ──
    if (pathname === '/users/me/main-travel' && method === 'PATCH') {
      const body = route.request().postDataJSON();
      const travelId = body.travelId ?? null;
      if (travelId && !state.travels.some((t) => t.id === travelId)) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Travel not found' }),
        });
      }
      state.user = { ...state.user, mainTravelId: travelId, updatedAt: new Date().toISOString() };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.user),
      });
    }

    // ── Users: /users/me ──
    if (pathname === '/users/me') {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.user),
        });
      }
      if (method === 'PATCH') {
        const body = route.request().postDataJSON();
        state.user = { ...state.user, ...body, updatedAt: new Date().toISOString() };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(state.user),
        });
      }
      return route.fallback();
    }

    // Unhandled API request — let it through (will likely 404)
    return route.fallback();
  });

  return state;
}

/**
 * Authenticate the page by setting the auth token in localStorage.
 */
export async function authenticatePage(page: Page, token: string) {
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
  }, token);
}
