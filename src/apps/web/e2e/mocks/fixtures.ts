/** Shared test fixtures for E2E tests — IDs use UUID format for Zod schema validation */

export const TEST_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const TEST_TOKEN =
  // JWT with { sub: "<user-uuid>" } payload — base64url encoded
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  btoa(
    JSON.stringify({
      sub: '00000000-0000-4000-8000-000000000001',
      exp: 9999999999,
    }),
  ) +
  '.fake-signature';

export const TEST_AUTH_SESSION = {
  accessToken: TEST_TOKEN,
  tokenType: 'Bearer',
  expiresIn: 2592000,
};

export const MEMBER_ID = '00000000-0000-4000-8000-000000000010';
export const TRAVEL_ID = '00000000-0000-4000-8000-000000000100';
export const CAT_FOOD_ID = '00000000-0000-4000-8000-000000001000';
export const CAT_TRANSPORT_ID = '00000000-0000-4000-8000-000000002000';
export const EXPENSE_ID = '00000000-0000-4000-8000-000000010000';

export const TEST_MEMBER_OWNER = {
  id: MEMBER_ID,
  travelId: TRAVEL_ID,
  userId: TEST_USER.id,
  guestName: null,
  role: 'owner' as const,
  user: TEST_USER,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const TEST_CATEGORY_FOOD = {
  id: CAT_FOOD_ID,
  travelId: TRAVEL_ID,
  name: 'Food & Drinks',
  icon: '🍔',
  color: '#F59E0B',
  budgetLimit: 500,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const TEST_CATEGORY_TRANSPORT = {
  id: CAT_TRANSPORT_ID,
  travelId: TRAVEL_ID,
  name: 'Transport',
  icon: '🚗',
  color: '#3B82F6',
  budgetLimit: 300,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const TEST_TRAVEL = {
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
};

export const TEST_TRAVEL_DETAIL = {
  ...TEST_TRAVEL,
  members: [TEST_MEMBER_OWNER],
  categories: [] as (typeof TEST_CATEGORY_FOOD)[],
};

export const TEST_TRAVEL_DETAIL_WITH_CATEGORIES = {
  ...TEST_TRAVEL,
  members: [TEST_MEMBER_OWNER],
  categories: [TEST_CATEGORY_FOOD, TEST_CATEGORY_TRANSPORT],
};

export const TEST_EXPENSE = {
  id: EXPENSE_ID,
  travelId: TRAVEL_ID,
  categoryId: CAT_FOOD_ID,
  memberId: MEMBER_ID,
  amount: 42.5,
  description: 'Lunch at bistro',
  date: '2026-06-02',
  createdAt: '2026-06-02T12:30:00.000Z',
  updatedAt: '2026-06-02T12:30:00.000Z',
};

export const EXPENSE_ID_2 = '00000000-0000-4000-8000-000000020000';

export const TEST_EXPENSE_2 = {
  id: EXPENSE_ID_2,
  travelId: TRAVEL_ID,
  categoryId: CAT_TRANSPORT_ID,
  memberId: MEMBER_ID,
  amount: 25.0,
  description: 'Taxi to airport',
  date: '2026-06-03',
  createdAt: '2026-06-03T09:00:00.000Z',
  updatedAt: '2026-06-03T09:00:00.000Z',
};

export const TEST_USER_ME = {
  id: TEST_USER.id,
  email: TEST_USER.email,
  name: TEST_USER.name,
  avatarUrl: null,
  mainTravelId: null as string | null,
  onboardingCompletedAt: null as string | null,
  dismissedTips: [] as string[],
  createdAt: TEST_USER.createdAt,
  updatedAt: TEST_USER.updatedAt,
};

export const TRAVEL_ID_2 = '00000000-0000-4000-8000-000000000200';

export const TEST_TRAVEL_2 = {
  id: TRAVEL_ID_2,
  name: 'Winter in Japan',
  description: 'Tokyo, Kyoto, Osaka',
  imageUrl: null,
  currency: 'JPY',
  budget: 500000,
  startDate: '2026-12-01',
  endDate: '2026-12-14',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

export const TEST_AVATAR_URL = 'https://res.cloudinary.com/demo/image/upload/v1234567/avatars/00000000-0000-4000-8000-000000000001';

export const TEST_DASHBOARD = {
  currency: 'EUR',
  overall: {
    budget: 3000,
    totalSpent: 42.5,
    status: 'ok' as const,
  },
  memberSpending: [
    {
      memberId: MEMBER_ID,
      displayName: 'Test User',
      totalSpent: 42.5,
    },
  ],
  categorySpending: [
    {
      categoryId: CAT_FOOD_ID,
      name: 'Food & Drinks',
      icon: '🍔',
      color: '#F59E0B',
      totalSpent: 42.5,
      budgetLimit: 500,
      status: 'ok' as const,
    },
    {
      categoryId: CAT_TRANSPORT_ID,
      name: 'Transport',
      icon: '🚗',
      color: '#3B82F6',
      totalSpent: 0,
      budgetLimit: 300,
      status: 'ok' as const,
    },
  ],
};

export const TEST_DASHBOARD_EMPTY = {
  currency: 'EUR',
  overall: {
    budget: 3000,
    totalSpent: 0,
    status: 'ok' as const,
  },
  memberSpending: [],
  categorySpending: [],
};
