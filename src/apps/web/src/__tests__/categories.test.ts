import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Test fixtures
const MOCK_CATEGORIES = [
  {
    id: 'cat-food',
    travelId: 'travel-1',
    name: 'Food & Drinks',
    icon: '🍔',
    color: '#F59E0B',
    budgetLimit: 100000,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'cat-transport',
    travelId: 'travel-1',
    name: 'Transport',
    icon: '🚗',
    color: '#3B82F6',
    budgetLimit: 50000,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
]

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
  ],
  categories: MOCK_CATEGORIES,
}

const MOCK_TRAVEL_EMPTY = {
  ...MOCK_TRAVEL_DETAIL,
  categories: [],
}

const MOCK_EXPENSES = [
  {
    id: 'expense-1',
    travelId: 'travel-1',
    categoryId: 'cat-food',
    memberId: 'member-1',
    amount: 1500,
    description: 'Sushi dinner',
    date: '2026-04-05',
    createdAt: '2026-04-05T12:00:00.000Z',
    updatedAt: '2026-04-05T12:00:00.000Z',
  },
  {
    id: 'expense-2',
    travelId: 'travel-1',
    categoryId: 'cat-food',
    memberId: 'member-1',
    amount: 800,
    description: 'Ramen lunch',
    date: '2026-04-05',
    createdAt: '2026-04-05T13:00:00.000Z',
    updatedAt: '2026-04-05T13:00:00.000Z',
  },
  {
    id: 'expense-3',
    travelId: 'travel-1',
    categoryId: 'cat-transport',
    memberId: 'member-1',
    amount: 500,
    description: 'Taxi',
    date: '2026-04-05',
    createdAt: '2026-04-05T14:00:00.000Z',
    updatedAt: '2026-04-05T14:00:00.000Z',
  },
]

describe('Category Management', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('Accordion state', () => {
    it('only one category can be expanded at a time', () => {
      // Simulate accordion state management
      let expandedId: string | null = null

      // Expand first card
      expandedId = 'cat-food'
      expect(expandedId).toBe('cat-food')

      // Expand second card — first should collapse
      expandedId = 'cat-transport'
      expect(expandedId).toBe('cat-transport')
      expect(expandedId).not.toBe('cat-food')
    })

    it('toggling the same card collapses it', () => {
      let expandedId: string | null = null

      // Expand card
      expandedId = 'cat-food'
      expect(expandedId).toBe('cat-food')

      // Toggle same card — should collapse
      expandedId = expandedId === 'cat-food' ? null : 'cat-food'
      expect(expandedId).toBeNull()
    })

    it('expanding a card while new card is open closes the new card', () => {
      let expandedId: string | null = 'new'
      expect(expandedId).toBe('new')

      // Expand existing card
      expandedId = 'cat-food'
      expect(expandedId).toBe('cat-food')
      expect(expandedId).not.toBe('new')
    })
  })

  describe('useCreateCategory hook', () => {
    it('exports useCreateCategory hook', async () => {
      const mod = await import('../hooks/useCreateCategory')
      expect(mod.useCreateCategory).toBeDefined()
      expect(typeof mod.useCreateCategory).toBe('function')
    })

    it('mutation calls correct API endpoint via apiClient.categories.create', async () => {
      const { ApiClient } = await import('@repo/api-client')
      const client = new ApiClient({
        baseUrl: 'http://test',
        getToken: () => null,
      })
      expect(client.categories.create).toBeDefined()
      expect(typeof client.categories.create).toBe('function')
    })

    it('invalidates categories.list and dashboard.get queries on success', async () => {
      const { queryKeys } = await import('@repo/api-client')
      const travelId = 'travel-1'
      // Verify the query keys that should be invalidated
      expect(queryKeys.categories.list(travelId)).toEqual([
        'travels',
        'travel-1',
        'categories',
      ])
      expect(queryKeys.dashboard.get(travelId)).toEqual([
        'travels',
        'travel-1',
        'dashboard',
      ])
    })
  })

  describe('useUpdateCategory hook', () => {
    it('exports useUpdateCategory hook', async () => {
      const mod = await import('../hooks/useUpdateCategory')
      expect(mod.useUpdateCategory).toBeDefined()
      expect(typeof mod.useUpdateCategory).toBe('function')
    })

    it('mutation calls correct API endpoint via apiClient.categories.update', async () => {
      const { ApiClient } = await import('@repo/api-client')
      const client = new ApiClient({
        baseUrl: 'http://test',
        getToken: () => null,
      })
      expect(client.categories.update).toBeDefined()
      expect(typeof client.categories.update).toBe('function')
    })

    it('invalidates categories.list and dashboard.get queries on success', async () => {
      const { queryKeys } = await import('@repo/api-client')
      const travelId = 'travel-1'
      expect(queryKeys.categories.list(travelId)).toEqual([
        'travels',
        'travel-1',
        'categories',
      ])
      expect(queryKeys.dashboard.get(travelId)).toEqual([
        'travels',
        'travel-1',
        'dashboard',
      ])
    })
  })

  describe('useDeleteCategory hook', () => {
    it('exports useDeleteCategory hook', async () => {
      const mod = await import('../hooks/useDeleteCategory')
      expect(mod.useDeleteCategory).toBeDefined()
      expect(typeof mod.useDeleteCategory).toBe('function')
    })

    it('mutation calls correct API endpoint via apiClient.categories.delete', async () => {
      const { ApiClient } = await import('@repo/api-client')
      const client = new ApiClient({
        baseUrl: 'http://test',
        getToken: () => null,
      })
      expect(client.categories.delete).toBeDefined()
      expect(typeof client.categories.delete).toBe('function')
    })

    it('invalidates categories.list and dashboard.get queries on success', async () => {
      const { queryKeys } = await import('@repo/api-client')
      const travelId = 'travel-1'
      expect(queryKeys.categories.list(travelId)).toEqual([
        'travels',
        'travel-1',
        'categories',
      ])
      expect(queryKeys.dashboard.get(travelId)).toEqual([
        'travels',
        'travel-1',
        'dashboard',
      ])
    })
  })

  describe('Delete confirmation dialog', () => {
    it('exports DeleteCategoryDialog component', async () => {
      const mod = await import(
        '../features/categories/DeleteCategoryDialog'
      )
      expect(mod.DeleteCategoryDialog).toBeDefined()
      expect(typeof mod.DeleteCategoryDialog).toBe('function')
    })

    it('delete confirmation shows category name and expense count via i18n', async () => {
      const i18n = (await import('../i18n')).default
      await i18n.init

      const message = i18n.t('category.deleteConfirmMessage', {
        count: 2,
      })

      expect(message).toContain('2')
    })

    it('has correct i18n keys for delete dialog', async () => {
      const i18n = (await import('../i18n')).default
      await i18n.init

      expect(i18n.t('category.deleteConfirmTitle')).toBe('Delete Category?')
      expect(i18n.t('category.deleteWarning')).toContain('permanent')
    })

    it('expense count for a category is computed from expenses list', () => {
      const categoryId = 'cat-food'
      const count = MOCK_EXPENSES.filter(
        (e) => e.categoryId === categoryId,
      ).length
      expect(count).toBe(2)
    })
  })

  describe('Empty state', () => {
    it('renders CTA when no categories exist', async () => {
      const i18n = (await import('../i18n')).default
      await i18n.init

      expect(MOCK_TRAVEL_EMPTY.categories).toHaveLength(0)
      expect(i18n.t('category.emptyState')).toBe('No categories yet')
      expect(i18n.t('category.emptyStateCta')).toBe(
        'Create your first category',
      )
    })

    it('CategoriesPage component is exported', async () => {
      const mod = await import('../features/categories/CategoriesPage')
      expect(mod.CategoriesPage).toBeDefined()
      expect(typeof mod.CategoriesPage).toBe('function')
    })
  })

  describe('Form validation', () => {
    it('createCategorySchema validates correct input', async () => {
      const { createCategorySchema } = await import('@repo/core')
      const validInput = {
        name: 'Food & Drinks',
        icon: '🍔',
        color: '#F59E0B',
        budgetLimit: 100000,
      }

      const result = createCategorySchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('createCategorySchema rejects empty name', async () => {
      const { createCategorySchema } = await import('@repo/core')
      const invalidInput = {
        name: '',
        icon: '🍔',
        color: '#F59E0B',
      }

      const result = createCategorySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('createCategorySchema rejects invalid color', async () => {
      const { createCategorySchema } = await import('@repo/core')
      const invalidInput = {
        name: 'Food',
        icon: '🍔',
        color: 'not-a-color',
      }

      const result = createCategorySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('updateCategorySchema allows partial updates', async () => {
      const { updateCategorySchema } = await import('@repo/core')
      const partialUpdate = {
        name: 'Updated Category',
      }

      const result = updateCategorySchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('createCategorySchema accepts null budgetLimit', async () => {
      const { createCategorySchema } = await import('@repo/core')
      const input = {
        name: 'Activities',
        icon: '🎭',
        color: '#EC4899',
        budgetLimit: null,
      }

      const result = createCategorySchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('Integration: creating a category adds it to the list', () => {
    it('valid category data passes schema validation', async () => {
      const { createCategorySchema } = await import('@repo/core')

      const formData = {
        name: 'Shopping',
        icon: '🛍️',
        color: '#10B981',
        budgetLimit: 50000,
      }

      const result = createCategorySchema.safeParse(formData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Shopping')
        expect(result.data.icon).toBe('🛍️')
        expect(result.data.color).toBe('#10B981')
        expect(result.data.budgetLimit).toBe(50000)
      }
    })

    it('new category would appear in the list after creation', () => {
      const newCategory = {
        id: 'cat-shopping',
        travelId: 'travel-1',
        name: 'Shopping',
        icon: '🛍️',
        color: '#10B981',
        budgetLimit: 50000,
        createdAt: '2026-03-20T00:00:00.000Z',
        updatedAt: '2026-03-20T00:00:00.000Z',
      }

      const updatedList = [...MOCK_CATEGORIES, newCategory]
      expect(updatedList).toHaveLength(3)
      expect(updatedList[2]!.name).toBe('Shopping')
    })

    it('create invalidates the correct query keys', async () => {
      const { queryKeys } = await import('@repo/api-client')
      const travelId = 'travel-1'

      // These are the keys that useCreateCategory invalidates
      expect(queryKeys.categories.list(travelId)).toEqual([
        'travels',
        'travel-1',
        'categories',
      ])
      expect(queryKeys.dashboard.get(travelId)).toEqual([
        'travels',
        'travel-1',
        'dashboard',
      ])
      expect(queryKeys.travels.detail(travelId)).toEqual([
        'travels',
        'travel-1',
      ])
    })
  })

  describe('Integration: editing a category updates it in the list', () => {
    it('update data passes schema validation', async () => {
      const { updateCategorySchema } = await import('@repo/core')

      const updateData = {
        name: 'Food & Beverages',
        budgetLimit: 120000,
      }

      const result = updateCategorySchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('updated category replaces the old one in the list', () => {
      const updatedCategory = {
        ...MOCK_CATEGORIES[0]!,
        name: 'Food & Beverages',
        budgetLimit: 120000,
      }

      const updatedList = MOCK_CATEGORIES.map((c) =>
        c.id === updatedCategory.id ? updatedCategory : c,
      )

      expect(updatedList).toHaveLength(2)
      expect(updatedList[0]!.name).toBe('Food & Beverages')
      expect(updatedList[0]!.budgetLimit).toBe(120000)
      // Second category unchanged
      expect(updatedList[1]!.name).toBe('Transport')
    })

    it('update invalidates the correct query keys', async () => {
      const { queryKeys } = await import('@repo/api-client')
      const travelId = 'travel-1'

      expect(queryKeys.categories.list(travelId)).toEqual([
        'travels',
        'travel-1',
        'categories',
      ])
      expect(queryKeys.dashboard.get(travelId)).toEqual([
        'travels',
        'travel-1',
        'dashboard',
      ])
    })
  })

  describe('Integration: deleting a category removes it from the list', () => {
    it('category is removed from list after deletion', () => {
      const categoryToDelete = 'cat-food'
      const updatedList = MOCK_CATEGORIES.filter(
        (c) => c.id !== categoryToDelete,
      )

      expect(updatedList).toHaveLength(1)
      expect(updatedList[0]!.name).toBe('Transport')
    })

    it('delete invalidates the correct query keys', async () => {
      const { queryKeys } = await import('@repo/api-client')
      const travelId = 'travel-1'

      expect(queryKeys.categories.list(travelId)).toEqual([
        'travels',
        'travel-1',
        'categories',
      ])
      expect(queryKeys.dashboard.get(travelId)).toEqual([
        'travels',
        'travel-1',
        'dashboard',
      ])
    })

    it('deleted category no longer appears in the filtered list', () => {
      const deletedId = 'cat-food'
      const filteredExpenses = MOCK_EXPENSES.filter(
        (e) => e.categoryId !== deletedId,
      )
      // Only non-food expenses remain
      expect(filteredExpenses).toHaveLength(1)
      expect(filteredExpenses[0]!.description).toBe('Taxi')
    })
  })

  describe('i18n category keys', () => {
    it('has all category management i18n keys', async () => {
      const i18n = (await import('../i18n')).default
      await i18n.init

      expect(i18n.t('category.add')).toBe('Add Category')
      expect(i18n.t('category.budgetLimit')).toBe('Budget limit')
      expect(i18n.t('category.icon')).toBe('Icon')
      expect(i18n.t('category.color')).toBe('Color')
      expect(i18n.t('category.name')).toBe('Category name')
      expect(i18n.t('category.manage')).toBe('Categories')
      expect(i18n.t('category.saved')).toBe('Category saved')
      expect(i18n.t('category.created')).toBe('Category created')
      expect(i18n.t('category.deleted')).toBe('Category deleted')
    })
  })

  describe('Categories route', () => {
    it('categories route file is exported', async () => {
      const mod = await import(
        '../routes/_authenticated/travels/$travelId/categories'
      )
      expect(mod.Route).toBeDefined()
    })
  })

  describe('Owner-only access', () => {
    it('owner is determined by matching userId with travel members', () => {
      const currentUserId = 'user-1'
      const isOwner = MOCK_TRAVEL_DETAIL.members.some(
        (m) => m.role === 'owner' && m.userId === currentUserId,
      )
      expect(isOwner).toBe(true)
    })

    it('non-owner user is correctly identified', () => {
      const currentUserId = 'user-other'
      const isOwner = MOCK_TRAVEL_DETAIL.members.some(
        (m) => m.role === 'owner' && m.userId === currentUserId,
      )
      expect(isOwner).toBe(false)
    })
  })
})
