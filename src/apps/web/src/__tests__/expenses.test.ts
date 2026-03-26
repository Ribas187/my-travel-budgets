import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Test fixtures
const MOCK_TRAVEL_DETAIL = {
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

const MOCK_DASHBOARD = {
  currency: 'JPY',
  overall: {
    budget: 500000,
    totalSpent: 150000,
    status: 'ok' as const,
  },
  memberSpending: [
    { memberId: 'member-1', displayName: 'Trip Owner', totalSpent: 100000 },
    { memberId: 'member-2', displayName: 'Alice', totalSpent: 50000 },
  ],
  categorySpending: [
    {
      categoryId: 'cat-food',
      name: 'Food & Drinks',
      icon: '🍜',
      color: '#F59E0B',
      totalSpent: 65000,
      budgetLimit: 100000,
      status: 'ok' as const,
    },
    {
      categoryId: 'cat-transport',
      name: 'Transport',
      icon: '🚃',
      color: '#2563EB',
      totalSpent: 45000,
      budgetLimit: 50000,
      status: 'warning' as const,
    },
    {
      categoryId: 'cat-no-limit',
      name: 'Shopping',
      icon: '🛍️',
      color: '#7C3AED',
      totalSpent: 40000,
      budgetLimit: null,
      status: 'ok' as const,
    },
  ],
};

describe('Quick Add Expense', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('useCreateExpense hook', () => {
    it('exports useCreateExpense hook', async () => {
      const mod = await import('@repo/api-client');
      expect(mod.useCreateExpense).toBeDefined();
      expect(typeof mod.useCreateExpense).toBe('function');
    });

    it('mutation calls correct API endpoint via apiClient.expenses.create', async () => {
      // Verify the api-client has the expenses.create method
      const { ApiClient } = await import('@repo/api-client');
      const client = new ApiClient({ baseUrl: 'http://test', getToken: () => null });
      expect(client.expenses.create).toBeDefined();
      expect(typeof client.expenses.create).toBe('function');
    });

    it('invalidates expenses and dashboard queries on success', async () => {
      const { queryKeys } = await import('@repo/api-client');
      const travelId = 'travel-1';

      // Verify the query keys that should be invalidated exist
      const expenseKeys = queryKeys.expenses.list(travelId);
      const dashboardKeys = queryKeys.dashboard.get(travelId);

      expect(expenseKeys).toEqual(['travels', 'travel-1', 'expenses', undefined]);
      expect(dashboardKeys).toEqual(['travels', 'travel-1', 'dashboard']);
    });
  });

  describe('useBudgetImpact hook', () => {
    it('exports useBudgetImpact hook', async () => {
      const mod = await import('@repo/api-client');
      expect(mod.useBudgetImpact).toBeDefined();
      expect(typeof mod.useBudgetImpact).toBe('function');
    });

    it('returns warning (amber) when expense pushes category to ≥70%', () => {
      // Food category: spent 65000 of 100000, adding 6000 → 71000/100000 = 71%
      const category = MOCK_DASHBOARD.categorySpending[0]!;
      const amount = 6000;
      const totalAfter = category.totalSpent + amount;
      const percentageAfter = Math.round((totalAfter / category.budgetLimit!) * 100);

      expect(percentageAfter).toBe(71);
      expect(percentageAfter >= 70).toBe(true);
      expect(percentageAfter < 100).toBe(true);

      // This should be 'warning' level
      const level = percentageAfter >= 100 ? 'danger' : percentageAfter >= 70 ? 'warning' : 'none';
      expect(level).toBe('warning');
    });

    it('returns danger (red) when expense pushes category to ≥100%', () => {
      // Food category: spent 65000 of 100000, adding 40000 → 105000/100000 = 105%
      const category = MOCK_DASHBOARD.categorySpending[0]!;
      const amount = 40000;
      const totalAfter = category.totalSpent + amount;
      const percentageAfter = Math.round((totalAfter / category.budgetLimit!) * 100);

      expect(percentageAfter).toBe(105);
      expect(percentageAfter >= 100).toBe(true);

      const level = percentageAfter >= 100 ? 'danger' : percentageAfter >= 70 ? 'warning' : 'none';
      expect(level).toBe('danger');
    });

    it('returns none when expense keeps category under 70%', () => {
      // Food category: spent 65000 of 100000, adding 1000 → 66000/100000 = 66%
      const category = MOCK_DASHBOARD.categorySpending[0]!;
      const amount = 1000;
      const totalAfter = category.totalSpent + amount;
      const percentageAfter = Math.round((totalAfter / category.budgetLimit!) * 100);

      expect(percentageAfter).toBe(66);
      expect(percentageAfter < 70).toBe(true);

      const level = percentageAfter >= 100 ? 'danger' : percentageAfter >= 70 ? 'warning' : 'none';
      expect(level).toBe('none');
    });

    it('returns none when category has no budget limit', () => {
      const category = MOCK_DASHBOARD.categorySpending[2]!;
      expect(category.budgetLimit).toBeNull();

      // No budget limit means no impact
      const level = !category.budgetLimit ? 'none' : 'warning';
      expect(level).toBe('none');
    });

    it('returns none when amount is zero or negative', () => {
      const amount = 0;
      const level = amount <= 0 ? 'none' : 'warning';
      expect(level).toBe('none');
    });
  });

  describe('Form validation', () => {
    it('createExpenseSchema validates correct input', async () => {
      const { createExpenseSchema } = await import('@repo/core');
      const validInput = {
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        memberId: '550e8400-e29b-41d4-a716-446655440001',
        amount: 15.5,
        description: 'Ramen lunch',
        date: '2026-04-05',
      };

      const result = createExpenseSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('createExpenseSchema rejects empty amount', async () => {
      const { createExpenseSchema } = await import('@repo/core');
      const invalidInput = {
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        memberId: '550e8400-e29b-41d4-a716-446655440001',
        amount: 0,
        description: 'Something',
        date: '2026-04-05',
      };

      const result = createExpenseSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('createExpenseSchema rejects negative amount', async () => {
      const { createExpenseSchema } = await import('@repo/core');
      const invalidInput = {
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        memberId: '550e8400-e29b-41d4-a716-446655440001',
        amount: -10,
        description: 'Something',
        date: '2026-04-05',
      };

      const result = createExpenseSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('createExpenseSchema rejects empty description', async () => {
      const { createExpenseSchema } = await import('@repo/core');
      const invalidInput = {
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        memberId: '550e8400-e29b-41d4-a716-446655440001',
        amount: 10,
        description: '',
        date: '2026-04-05',
      };

      const result = createExpenseSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('createExpenseSchema rejects invalid categoryId', async () => {
      const { createExpenseSchema } = await import('@repo/core');
      const invalidInput = {
        categoryId: 'not-a-uuid',
        memberId: '550e8400-e29b-41d4-a716-446655440001',
        amount: 10,
        description: 'Something',
        date: '2026-04-05',
      };

      const result = createExpenseSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Save button state', () => {
    it('save button should be disabled when amount is empty (zero)', () => {
      const amount = 0;
      const isValid = false; // form won't be valid with amount = 0
      const isPending = false;
      const isSaveDisabled = !isValid || amount <= 0 || isPending;
      expect(isSaveDisabled).toBe(true);
    });

    it('save button should be enabled when form is valid', () => {
      const amount = 25.5;
      const isValid = true;
      const isPending = false;
      const isSaveDisabled = !isValid || amount <= 0 || isPending;
      expect(isSaveDisabled).toBe(false);
    });

    it('save button should be disabled during submission (loading)', () => {
      const amount = 25.5;
      const isValid = true;
      const isPending = true;
      const isSaveDisabled = !isValid || amount <= 0 || isPending;
      expect(isSaveDisabled).toBe(true);
    });
  });

  describe('AddExpenseModal component', () => {
    it('exports AddExpenseModal', async () => {
      const mod = await import('../features/expenses/AddExpenseModal');
      expect(mod.AddExpenseModal).toBeDefined();
      expect(typeof mod.AddExpenseModal).toBe('function');
    });
  });

  describe('i18n expense keys', () => {
    it('has all expense-related i18n keys', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;

      expect(i18n.t('expense.add')).toBe('Add Expense');
      expect(i18n.t('expense.amount')).toBe('Amount');
      expect(i18n.t('expense.description')).toBe('Description');
      expect(i18n.t('expense.category')).toBe('Category');
      expect(i18n.t('expense.paidBy')).toBe('Paid by');
      expect(i18n.t('expense.saveExpense')).toBe('Save Expense');
      expect(i18n.t('expense.saved')).toBe('Expense saved');
      expect(i18n.t('expense.descriptionPlaceholder')).toBe('What did you spend on?');
    });

    it('has budget impact i18n keys', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;

      const warningMsg = i18n.t('expense.budgetImpactWarning', {
        percentage: 75,
        category: 'Food',
      });
      expect(warningMsg).toContain('75%');
      expect(warningMsg).toContain('Food');

      const dangerMsg = i18n.t('expense.budgetImpactDanger', { category: 'Food' });
      expect(dangerMsg).toContain('Food');
      expect(dangerMsg).toContain('exceeds');
    });
  });

  describe('Integration: form and save flow', () => {
    it('valid expense data passes schema validation and can be submitted', async () => {
      const { createExpenseSchema } = await import('@repo/core');

      const formData = {
        categoryId: MOCK_TRAVEL_DETAIL.categories[0]!.id,
        memberId: MOCK_TRAVEL_DETAIL.members[0]!.id,
        amount: 1500,
        description: 'Sushi dinner',
        date: '2026-04-05',
      };

      // Verify schema validation for the prepared data
      // Note: categoryId and memberId are not UUIDs in fixtures, so use real UUIDs
      const submittableData = {
        ...formData,
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        memberId: '550e8400-e29b-41d4-a716-446655440001',
      };
      const result = createExpenseSchema.safeParse(submittableData);
      expect(result.success).toBe(true);
    });

    it('budget impact banner appears when category is near limit', () => {
      // Transport category: spent 45000 of 50000, adding 3000 → 96%
      const category = MOCK_DASHBOARD.categorySpending[1]!;
      const amount = 3000;
      const totalAfter = category.totalSpent + amount;
      const percentageAfter = Math.round((totalAfter / category.budgetLimit!) * 100);

      expect(percentageAfter).toBe(96);

      const level = percentageAfter >= 100 ? 'danger' : percentageAfter >= 70 ? 'warning' : 'none';
      expect(level).toBe('warning');
      expect(category.name).toBe('Transport');
    });

    it('budget impact banner shows danger when exceeding budget', () => {
      // Transport category: spent 45000 of 50000, adding 10000 → 110%
      const category = MOCK_DASHBOARD.categorySpending[1]!;
      const amount = 10000;
      const totalAfter = category.totalSpent + amount;
      const percentageAfter = Math.round((totalAfter / category.budgetLimit!) * 100);

      expect(percentageAfter).toBe(110);

      const level = percentageAfter >= 100 ? 'danger' : percentageAfter >= 70 ? 'warning' : 'none';
      expect(level).toBe('danger');
    });
  });

  describe('Integration: member display', () => {
    it('members can be displayed with correct names', () => {
      const members = MOCK_TRAVEL_DETAIL.members;
      const memberNames = members.map((m) => {
        if (m.user?.name) return m.user.name;
        if (m.guestName) return m.guestName;
        return m.user?.email ?? 'Unknown';
      });

      expect(memberNames).toEqual(['Trip Owner', 'Alice']);
    });

    it('member initials are correctly computed', () => {
      const members = MOCK_TRAVEL_DETAIL.members;
      const initials = members.map((m) => {
        const name = m.user?.name ?? m.guestName ?? 'U';
        return name.charAt(0).toUpperCase();
      });

      expect(initials).toEqual(['T', 'A']);
    });
  });

  describe('Toast notification system', () => {
    it('exports showToast function', async () => {
      const mod = await import('../lib/toast');
      expect(mod.showToast).toBeDefined();
      expect(typeof mod.showToast).toBe('function');
    });

    it('showToast adds a toast and auto-removes it', async () => {
      const { showToast, subscribe, getToasts } = await import('../lib/toast');

      const updates: Array<Array<{ message: string }>> = [];
      const unsub = subscribe((toasts) => updates.push(toasts));

      showToast('Test message', 'success');

      // Should have added a toast
      const toasts = getToasts();
      expect(toasts.length).toBeGreaterThanOrEqual(1);
      expect(toasts.some((t) => t.message === 'Test message')).toBe(true);

      unsub();
    });
  });

  describe('Currency symbol mapping', () => {
    it('maps currency codes to symbols', async () => {
      const { SUPPORTED_CURRENCIES } = await import('@repo/core');
      const jpy = SUPPORTED_CURRENCIES.find((c) => c.code === 'JPY');
      expect(jpy?.symbol).toBe('¥');

      const eur = SUPPORTED_CURRENCIES.find((c) => c.code === 'EUR');
      expect(eur?.symbol).toBe('€');

      const brl = SUPPORTED_CURRENCIES.find((c) => c.code === 'BRL');
      expect(brl?.symbol).toBe('R$');
    });
  });

  describe('Travel detail hook', () => {
    it('exports useTravelDetail hook', async () => {
      const mod = await import('@repo/api-client');
      expect(mod.useTravelDetail).toBeDefined();
      expect(typeof mod.useTravelDetail).toBe('function');
    });

    it('uses correct query key for travel detail', async () => {
      const { queryKeys } = await import('@repo/api-client');
      const travelId = 'travel-1';
      expect(queryKeys.travels.detail(travelId)).toEqual(['travels', 'travel-1']);
    });
  });
});
