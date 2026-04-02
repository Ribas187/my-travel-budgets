import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApiClient } from '../client';
import type { ApiError } from '../types';

const BASE_URL = 'https://api.mybudget.cards';
const TEST_TOKEN = 'test-jwt-token';

function createClient(getToken: () => string | null = () => TEST_TOKEN) {
  return new ApiClient({ baseUrl: BASE_URL, getToken });
}

function mockFetchSuccess(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status,
    headers: new Headers({ 'content-length': status === 204 ? '0' : '1' }),
    json: () => Promise.resolve(data),
  });
}

function mockFetch204() {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 204,
    headers: new Headers({ 'content-length': '0' }),
    json: () => Promise.reject(new Error('No JSON')),
  });
}

function mockFetchError(status: number, body: { message?: string; errors?: string[] }) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(body),
  });
}

describe('ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Auth header', () => {
    it('attaches Bearer token when token exists', async () => {
      const fetchMock = mockFetchSuccess([]);
      globalThis.fetch = fetchMock;

      const client = createClient(() => TEST_TOKEN);
      await client.travels.list();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Authorization']).toBe(`Bearer ${TEST_TOKEN}`);
    });

    it('omits Authorization header when token is null', async () => {
      const fetchMock = mockFetchSuccess([]);
      globalThis.fetch = fetchMock;

      const client = createClient(() => null);
      await client.travels.list();

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Authorization']).toBeUndefined();
    });

    it('omits Authorization header for auth endpoints', async () => {
      const fetchMock = mockFetchSuccess(undefined, 202);
      globalThis.fetch = fetchMock;

      const client = createClient(() => TEST_TOKEN);
      await client.auth.requestMagicLink('user@example.com');

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Authorization']).toBeUndefined();
    });
  });

  describe('auth.requestMagicLink', () => {
    it('sends POST to /auth/magic-link with email body', async () => {
      const fetchMock = mockFetchSuccess(undefined, 202);
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.auth.requestMagicLink('user@example.com');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/auth/magic-link`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ email: 'user@example.com' });
    });
  });

  describe('auth.verify', () => {
    it('sends GET to /auth/verify with token query param', async () => {
      const session = { accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 2592000 };
      const fetchMock = mockFetchSuccess(session);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.auth.verify('magic-token-123');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/auth/verify?token=magic-token-123`);
      expect(init.method).toBe('GET');
      expect(result).toEqual(session);
    });
  });

  describe('auth.requestPin', () => {
    it('sends POST to /auth/login-pin with email body and no auth header', async () => {
      const fetchMock = mockFetchSuccess(undefined, 202);
      globalThis.fetch = fetchMock;

      const client = createClient(() => TEST_TOKEN);
      await client.auth.requestPin('user@example.com');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/auth/login-pin`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ email: 'user@example.com' });
      expect(init.headers['Authorization']).toBeUndefined();
    });
  });

  describe('auth.verifyPin', () => {
    it('sends POST to /auth/verify-pin with email and pin body, returns AuthSession', async () => {
      const session = { accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 2592000 };
      const fetchMock = mockFetchSuccess(session);
      globalThis.fetch = fetchMock;

      const client = createClient(() => TEST_TOKEN);
      const result = await client.auth.verifyPin('user@example.com', '482917');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/auth/verify-pin`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ email: 'user@example.com', pin: '482917' });
      expect(init.headers['Authorization']).toBeUndefined();
      expect(result).toEqual(session);
    });
  });

  describe('travels', () => {
    it('list sends GET to /travels', async () => {
      const travels = [{ id: '1', name: 'Trip 1' }];
      const fetchMock = mockFetchSuccess(travels);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.travels.list();

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels`);
      expect(init.method).toBe('GET');
      expect(result).toEqual(travels);
    });

    it('get sends GET to /travels/:id', async () => {
      const travel = { id: 't1', name: 'Trip 1', members: [] };
      const fetchMock = mockFetchSuccess(travel);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.travels.get('t1');

      expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/travels/t1`);
      expect(result).toEqual(travel);
    });

    it('create sends POST to /travels with body', async () => {
      const newTravel = { id: 't1', name: 'Paris' };
      const fetchMock = mockFetchSuccess(newTravel);
      globalThis.fetch = fetchMock;

      const input = {
        name: 'Paris',
        currency: 'EUR' as const,
        budget: 5000,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      };

      const client = createClient();
      const result = await client.travels.create(input);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(input);
      expect(result).toEqual(newTravel);
    });

    it('update sends PATCH to /travels/:id with body', async () => {
      const updated = { id: 't1', name: 'Paris Updated' };
      const fetchMock = mockFetchSuccess(updated);
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.travels.update('t1', { name: 'Paris Updated' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1`);
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body)).toEqual({ name: 'Paris Updated' });
    });

    it('delete sends DELETE to /travels/:id', async () => {
      const fetchMock = mockFetch204();
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.travels.delete('t1');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1`);
      expect(init.method).toBe('DELETE');
    });
  });

  describe('members', () => {
    it('add sends POST to /travels/:travelId/members', async () => {
      const member = { id: 'm1', travelId: 't1', role: 'member' };
      const fetchMock = mockFetchSuccess(member);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.members.add('t1', { email: 'friend@example.com' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/members`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ email: 'friend@example.com' });
      expect(result).toEqual(member);
    });

    it('remove sends DELETE to /travels/:travelId/members/:memberId', async () => {
      const fetchMock = mockFetch204();
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.members.remove('t1', 'm1');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/members/m1`);
      expect(init.method).toBe('DELETE');
    });
  });

  describe('expenses', () => {
    it('list sends GET to /travels/:travelId/expenses', async () => {
      const expenses = [{ id: 'e1', amount: 42 }];
      const fetchMock = mockFetchSuccess(expenses);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.expenses.list('t1');

      expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/travels/t1/expenses`);
      expect(result).toEqual(expenses);
    });

    it('list sends query params when filters are provided', async () => {
      const fetchMock = mockFetchSuccess([]);
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.expenses.list('t1', { categoryId: 'cat1', page: 2 });

      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('categoryId=cat1');
      expect(url).toContain('page=2');
    });

    it('list omits undefined filter params', async () => {
      const fetchMock = mockFetchSuccess([]);
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.expenses.list('t1', { categoryId: 'cat1' });

      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('categoryId=cat1');
      expect(url).not.toContain('memberId');
    });

    it('create sends POST to /travels/:travelId/expenses with body', async () => {
      const expense = { id: 'e1', amount: 25 };
      const fetchMock = mockFetchSuccess(expense);
      globalThis.fetch = fetchMock;

      const input = {
        categoryId: 'cat1',
        memberId: 'm1',
        amount: 25,
        description: 'Lunch',
        date: '2026-06-02',
      };

      const client = createClient();
      const result = await client.expenses.create('t1', input);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/expenses`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(input);
      expect(result).toEqual(expense);
    });

    it('update sends PATCH to /travels/:travelId/expenses/:expenseId with body', async () => {
      const updated = { id: 'e1', amount: 30, description: 'Updated lunch' };
      const fetchMock = mockFetchSuccess(updated);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.expenses.update('t1', 'e1', {
        amount: 30,
        description: 'Updated lunch',
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/expenses/e1`);
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body)).toEqual({ amount: 30, description: 'Updated lunch' });
      expect(result).toEqual(updated);
    });

    it('update sends only provided fields (partial update)', async () => {
      const fetchMock = mockFetchSuccess({ id: 'e1', amount: 50 });
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.expenses.update('t1', 'e1', { amount: 50 });

      const [, init] = fetchMock.mock.calls[0];
      expect(JSON.parse(init.body)).toEqual({ amount: 50 });
    });

    it('delete sends DELETE to /travels/:travelId/expenses/:expenseId', async () => {
      const fetchMock = mockFetch204();
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.expenses.delete('t1', 'e1');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/expenses/e1`);
      expect(init.method).toBe('DELETE');
    });
  });

  describe('categories', () => {
    it('create sends POST to /travels/:travelId/categories', async () => {
      const category = { id: 'cat1', name: 'Food' };
      const fetchMock = mockFetchSuccess(category);
      globalThis.fetch = fetchMock;

      const input = { name: 'Food', icon: 'utensils', color: '#FF5733' };
      const client = createClient();
      const result = await client.categories.create('t1', input);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/categories`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(input);
      expect(result).toEqual(category);
    });

    it('update sends PATCH to /travels/:travelId/categories/:catId', async () => {
      const updated = { id: 'cat1', name: 'Dining' };
      const fetchMock = mockFetchSuccess(updated);
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.categories.update('t1', 'cat1', { name: 'Dining' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/categories/cat1`);
      expect(init.method).toBe('PATCH');
    });

    it('delete sends DELETE to /travels/:travelId/categories/:catId', async () => {
      const fetchMock = mockFetch204();
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.categories.delete('t1', 'cat1');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/travels/t1/categories/cat1`);
      expect(init.method).toBe('DELETE');
    });
  });

  describe('dashboard', () => {
    it('get sends GET to /travels/:travelId/dashboard', async () => {
      const dashboard = {
        currency: 'USD',
        overall: { budget: 5000, totalSpent: 1200, status: 'ok' },
        memberSpending: [],
        categorySpending: [],
      };
      const fetchMock = mockFetchSuccess(dashboard);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.dashboard.get('t1');

      expect(fetchMock.mock.calls[0][0]).toBe(`${BASE_URL}/travels/t1/dashboard`);
      expect(result).toEqual(dashboard);
    });
  });

  describe('users', () => {
    it('getMe sends GET to /users/me', async () => {
      const user = {
        id: 'u1',
        email: 'user@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      const fetchMock = mockFetchSuccess(user);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.users.getMe();

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/users/me`);
      expect(init.method).toBe('GET');
      expect(init.headers['Authorization']).toBe(`Bearer ${TEST_TOKEN}`);
      expect(result).toEqual(user);
    });

    it('updateMe sends PATCH to /users/me with body', async () => {
      const updated = {
        id: 'u1',
        email: 'user@example.com',
        name: 'New Name',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-03-20T00:00:00Z',
      };
      const fetchMock = mockFetchSuccess(updated);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.users.updateMe({ name: 'New Name' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/users/me`);
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body)).toEqual({ name: 'New Name' });
      expect(result).toEqual(updated);
    });
  });

  describe('error handling', () => {
    it('maps 4xx response to ApiError', async () => {
      const fetchMock = mockFetchError(400, {
        message: 'Validation failed',
        errors: ['name is required'],
      });
      globalThis.fetch = fetchMock;

      const client = createClient();

      try {
        await client.travels.create({
          name: '',
          currency: 'USD' as const,
          budget: 100,
          startDate: '2026-01-01',
          endDate: '2026-01-10',
        });
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as ApiError;
        expect(apiError.statusCode).toBe(400);
        expect(apiError.message).toBe('Validation failed');
        expect(apiError.errors).toEqual(['name is required']);
      }
    });

    it('maps 5xx response to ApiError', async () => {
      const fetchMock = mockFetchError(500, { message: 'Internal Server Error' });
      globalThis.fetch = fetchMock;

      const client = createClient();

      try {
        await client.travels.list();
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as ApiError;
        expect(apiError.statusCode).toBe(500);
        expect(apiError.message).toBe('Internal Server Error');
      }
    });

    it('handles non-JSON error responses', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.reject(new Error('Not JSON')),
      });

      const client = createClient();

      try {
        await client.travels.list();
        expect.fail('Should have thrown');
      } catch (err) {
        const apiError = err as ApiError;
        expect(apiError.statusCode).toBe(502);
        expect(apiError.message).toBe('Bad Gateway');
      }
    });
  });

  describe('request body serialization', () => {
    it('serializes body as JSON', async () => {
      const fetchMock = mockFetchSuccess({ id: 'e1' });
      globalThis.fetch = fetchMock;

      const client = createClient();
      const input = {
        categoryId: 'cat1',
        memberId: 'm1',
        amount: 42.5,
        description: 'Test expense',
        date: '2026-06-01',
      };

      await client.expenses.create('t1', input);

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(init.body)).toEqual(input);
    });

    it('omits body for GET requests', async () => {
      const fetchMock = mockFetchSuccess([]);
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.travels.list();

      const [, init] = fetchMock.mock.calls[0];
      expect(init.body).toBeUndefined();
    });
  });
});
