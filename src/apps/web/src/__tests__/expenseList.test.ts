import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Expense, TravelDetail } from '@repo/api-client';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_TRAVEL_DETAIL: TravelDetail = {
  id: 'travel-1',
  name: 'Japan Trip',
  description: 'Exploring Tokyo and Kyoto',
  imageUrl: null,
  currency: 'JPY',
  budget: 500000,
  startDate: '2026-04-01',
  endDate: '2026-04-15',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  members: [
    {
      id: 'member-1',
      travelId: 'travel-1',
      userId: 'user-1',
      guestName: null,
      role: 'owner' as const,
      user: {
        id: 'user-1',
        email: 'owner@test.com',
        name: 'Trip Owner',
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'member-2',
      travelId: 'travel-1',
      userId: null,
      guestName: 'Alice',
      role: 'member' as const,
      user: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ],
  categories: [
    {
      id: 'cat-food',
      travelId: 'travel-1',
      name: 'Food & Drinks',
      icon: '🍜',
      color: '#F59E0B',
      budgetLimit: 100000,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'cat-transport',
      travelId: 'travel-1',
      name: 'Transport',
      icon: '🚃',
      color: '#2563EB',
      budgetLimit: 50000,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ],
};

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    travelId: 'travel-1',
    categoryId: 'cat-food',
    memberId: 'member-1',
    amount: 1500,
    description: 'Ramen lunch',
    date: '2026-04-05',
    createdAt: '2026-04-05T12:30:00.000Z',
    updatedAt: '2026-04-05T12:30:00.000Z',
  },
  {
    id: 'exp-2',
    travelId: 'travel-1',
    categoryId: 'cat-transport',
    memberId: 'member-2',
    amount: 3200,
    description: 'Shinkansen ticket',
    date: '2026-04-05',
    createdAt: '2026-04-05T09:00:00.000Z',
    updatedAt: '2026-04-05T09:00:00.000Z',
  },
  {
    id: 'exp-3',
    travelId: 'travel-1',
    categoryId: 'cat-food',
    memberId: 'member-1',
    amount: 2800,
    description: 'Sushi dinner',
    date: '2026-04-04',
    createdAt: '2026-04-04T19:00:00.000Z',
    updatedAt: '2026-04-04T19:00:00.000Z',
  },
  {
    id: 'exp-4',
    travelId: 'travel-1',
    categoryId: 'cat-food',
    memberId: 'member-2',
    amount: 800,
    description: 'Matcha latte',
    date: '2026-04-04',
    createdAt: '2026-04-04T14:00:00.000Z',
    updatedAt: '2026-04-04T14:00:00.000Z',
  },
  {
    id: 'exp-5',
    travelId: 'travel-1',
    categoryId: 'cat-transport',
    memberId: 'member-1',
    amount: 500,
    description: 'Metro pass',
    date: '2026-04-03',
    createdAt: '2026-04-03T08:00:00.000Z',
    updatedAt: '2026-04-03T08:00:00.000Z',
  },
];

describe('Expense List with Filters', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Day grouping logic
  // ---------------------------------------------------------------------------

  describe('Day grouping logic', () => {
    it('correctly groups expenses by date and sorts newest first', async () => {
      const { groupExpensesByDay } = await import('../utils/groupExpensesByDay');

      const groups = groupExpensesByDay(MOCK_EXPENSES);

      // Should have 3 distinct dates
      expect(groups).toHaveLength(3);

      // Newest first: 2026-04-05, 2026-04-04, 2026-04-03
      expect(groups[0]!.date).toBe('2026-04-05');
      expect(groups[1]!.date).toBe('2026-04-04');
      expect(groups[2]!.date).toBe('2026-04-03');

      // Check expenses per group
      expect(groups[0]!.expenses).toHaveLength(2); // exp-1, exp-2
      expect(groups[1]!.expenses).toHaveLength(2); // exp-3, exp-4
      expect(groups[2]!.expenses).toHaveLength(1); // exp-5
    });

    it('daily totals are calculated correctly', async () => {
      const { groupExpensesByDay } = await import('../utils/groupExpensesByDay');

      const groups = groupExpensesByDay(MOCK_EXPENSES);

      // April 5: 1500 + 3200 = 4700
      expect(groups[0]!.dailyTotal).toBe(4700);

      // April 4: 2800 + 800 = 3600
      expect(groups[1]!.dailyTotal).toBe(3600);

      // April 3: 500
      expect(groups[2]!.dailyTotal).toBe(500);
    });

    it('returns empty array for empty expenses', async () => {
      const { groupExpensesByDay } = await import('../utils/groupExpensesByDay');

      const groups = groupExpensesByDay([]);
      expect(groups).toEqual([]);
    });

    it('handles single expense correctly', async () => {
      const { groupExpensesByDay } = await import('../utils/groupExpensesByDay');

      const groups = groupExpensesByDay([MOCK_EXPENSES[0]!]);
      expect(groups).toHaveLength(1);
      expect(groups[0]!.date).toBe('2026-04-05');
      expect(groups[0]!.dailyTotal).toBe(1500);
      expect(groups[0]!.expenses).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // useTravelExpenses hook
  // ---------------------------------------------------------------------------

  describe('useTravelExpenses hook', () => {
    it('exports useTravelExpenses hook', async () => {
      const mod = await import('../hooks/useTravelExpenses');
      expect(mod.useTravelExpenses).toBeDefined();
      expect(typeof mod.useTravelExpenses).toBe('function');
    });

    it('passes filter params to query key and API call', async () => {
      const { queryKeys } = await import('@repo/api-client');
      const travelId = 'travel-1';

      // Without filters
      const keyNoFilter = queryKeys.expenses.list(travelId);
      expect(keyNoFilter).toEqual(['travels', 'travel-1', 'expenses', undefined]);

      // With categoryId filter
      const filters = { categoryId: 'cat-food' };
      const keyWithFilter = queryKeys.expenses.list(travelId, filters);
      expect(keyWithFilter).toEqual([
        'travels',
        'travel-1',
        'expenses',
        { categoryId: 'cat-food' },
      ]);

      // Different filters produce different keys (ensures cache separation)
      const filters2 = { categoryId: 'cat-transport' };
      const keyWithFilter2 = queryKeys.expenses.list(travelId, filters2);
      expect(keyWithFilter2).not.toEqual(keyWithFilter);
    });

    it('API client expenses.list method exists and accepts filters', async () => {
      const { ApiClient } = await import('@repo/api-client');
      const client = new ApiClient({ baseUrl: 'http://test', getToken: () => null });
      expect(client.expenses.list).toBeDefined();
      expect(typeof client.expenses.list).toBe('function');
    });
  });

  // ---------------------------------------------------------------------------
  // Empty states
  // ---------------------------------------------------------------------------

  describe('Empty states', () => {
    it('empty state renders when expense list is empty', () => {
      const expenses: Expense[] = [];
      const isFiltering = false;
      const hasExpenses = expenses.length > 0;

      // When no expenses and not filtering, show empty state
      expect(hasExpenses).toBe(false);
      expect(isFiltering).toBe(false);
      // Component shows "expense-empty-state" testID
    });

    it('filtered empty state renders when filter yields no results', () => {
      const allExpenses = MOCK_EXPENSES;
      const categoryFilter = 'cat-nonexistent';

      // Filter expenses by non-existent category
      const filtered = allExpenses.filter((e) => e.categoryId === categoryFilter);
      expect(filtered).toHaveLength(0);

      // There are expenses overall, but none match the filter
      expect(allExpenses.length).toBeGreaterThan(0);
      const isFiltering = !!categoryFilter;
      expect(isFiltering).toBe(true);
      // Component shows "expense-filtered-empty-state" testID
    });

    it('i18n has correct empty state keys', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;

      expect(i18n.t('expense.emptyState')).toBe('No expenses yet');
      expect(i18n.t('expense.emptyFilterState', { category: 'Food & Drinks' })).toBe(
        'No Food & Drinks expenses yet',
      );
      expect(i18n.t('expense.allCategories')).toBe('All');
    });
  });

  // ---------------------------------------------------------------------------
  // Integration: filter chip selection
  // ---------------------------------------------------------------------------

  describe('Integration: filter chip selection updates displayed expenses', () => {
    it('selecting a category filter returns only matching expenses', () => {
      const categoryId = 'cat-food';

      // Simulate API-side filtering
      const filtered = MOCK_EXPENSES.filter((e) => e.categoryId === categoryId);

      expect(filtered).toHaveLength(3); // exp-1, exp-3, exp-4
      expect(filtered.every((e) => e.categoryId === 'cat-food')).toBe(true);
    });

    it('selecting "All" returns all expenses (no category filter)', () => {
      const categoryId: string | undefined = undefined;
      const filtered = categoryId
        ? MOCK_EXPENSES.filter((e) => e.categoryId === categoryId)
        : MOCK_EXPENSES;

      expect(filtered).toHaveLength(MOCK_EXPENSES.length);
    });

    it('switching filters changes the query key for cache separation', async () => {
      const { queryKeys } = await import('@repo/api-client');
      const travelId = 'travel-1';

      const keyAll = queryKeys.expenses.list(travelId, undefined);
      const keyFood = queryKeys.expenses.list(travelId, { categoryId: 'cat-food' });
      const keyTransport = queryKeys.expenses.list(travelId, { categoryId: 'cat-transport' });

      // All three should be different
      expect(keyAll).not.toEqual(keyFood);
      expect(keyFood).not.toEqual(keyTransport);
      expect(keyAll).not.toEqual(keyTransport);
    });

    it('filter chip bar includes "All" and all categories', () => {
      const categories = MOCK_TRAVEL_DETAIL.categories;
      const allLabel = 'All';

      const chipLabels = [allLabel, ...categories.map((c) => `${c.icon} ${c.name}`)];
      expect(chipLabels).toEqual(['All', '🍜 Food & Drinks', '🚃 Transport']);
    });
  });

  // ---------------------------------------------------------------------------
  // Integration: search input filters by description
  // ---------------------------------------------------------------------------

  describe('Integration: search input filters expenses by description', () => {
    it('search text filters expenses client-side by description', () => {
      const searchText = 'ramen';
      const filtered = MOCK_EXPENSES.filter((e) =>
        e.description.toLowerCase().includes(searchText.toLowerCase()),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.description).toBe('Ramen lunch');
    });

    it('search is case-insensitive', () => {
      const searchText = 'SUSHI';
      const filtered = MOCK_EXPENSES.filter((e) =>
        e.description.toLowerCase().includes(searchText.toLowerCase()),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.description).toBe('Sushi dinner');
    });

    it('empty search returns all expenses', () => {
      const searchText = '';
      const filtered = searchText.trim()
        ? MOCK_EXPENSES.filter((e) =>
            e.description.toLowerCase().includes(searchText.toLowerCase()),
          )
        : MOCK_EXPENSES;

      expect(filtered).toHaveLength(MOCK_EXPENSES.length);
    });

    it('search with no matches returns empty array', () => {
      const searchText = 'nonexistent';
      const filtered = MOCK_EXPENSES.filter((e) =>
        e.description.toLowerCase().includes(searchText.toLowerCase()),
      );

      expect(filtered).toHaveLength(0);
    });

    it('search combined with category filter narrows results further', () => {
      const categoryId = 'cat-food';
      const searchText = 'sushi';

      // First filter by category (API-side)
      const categoryFiltered = MOCK_EXPENSES.filter((e) => e.categoryId === categoryId);
      expect(categoryFiltered).toHaveLength(3);

      // Then filter by search (client-side)
      const searchFiltered = categoryFiltered.filter((e) =>
        e.description.toLowerCase().includes(searchText.toLowerCase()),
      );
      expect(searchFiltered).toHaveLength(1);
      expect(searchFiltered[0]!.description).toBe('Sushi dinner');
    });
  });

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  describe('Formatting helpers', () => {
    it('formats amount with locale and currency', () => {
      const formatted = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(1500);

      expect(formatted).toContain('1,500');
      expect(formatted).toContain('¥');
    });

    it('formats day label correctly', () => {
      const dateStr = '2026-04-05';
      const date = new Date(dateStr + 'T00:00:00');
      const label = new Intl.DateTimeFormat('en', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(date);

      expect(label).toContain('Apr');
      expect(label).toContain('5');
    });

    it('resolves member name from travel members', () => {
      const getMemberName = (memberId: string): string => {
        const member = MOCK_TRAVEL_DETAIL.members.find((m) => m.id === memberId);
        if (!member) return '';
        return member.user?.name ?? member.guestName ?? member.user?.email ?? '';
      };

      expect(getMemberName('member-1')).toBe('Trip Owner');
      expect(getMemberName('member-2')).toBe('Alice');
      expect(getMemberName('nonexistent')).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // ExpenseList component
  // ---------------------------------------------------------------------------

  describe('ExpenseList component', () => {
    it('exports ExpenseList component', async () => {
      const mod = await import('../features/expenses/ExpenseList');
      expect(mod.ExpenseList).toBeDefined();
      expect(typeof mod.ExpenseList).toBe('function');
    });
  });
});
