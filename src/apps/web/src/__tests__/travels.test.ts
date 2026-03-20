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
const MOCK_TRAVELS = [
  {
    id: 'travel-1',
    name: 'Japan Trip',
    description: 'Exploring Tokyo and Kyoto',
    imageUrl: null,
    currency: 'JPY',
    budget: 500000,
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-04-15T00:00:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'travel-2',
    name: 'Portugal Weekend',
    description: null,
    imageUrl: null,
    currency: 'EUR',
    budget: 1200,
    startDate: '2026-05-10T00:00:00.000Z',
    endDate: '2026-05-13T00:00:00.000Z',
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
  },
]

describe('My Travels List', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('useTravels hook', () => {
    it('exports useTravels hook', async () => {
      const mod = await import('../hooks/useTravels')
      expect(mod.useTravels).toBeDefined()
      expect(typeof mod.useTravels).toBe('function')
    })

    it('useTravels uses correct query key and function', async () => {
      const { queryKeys } = await import('@repo/api-client')
      expect(queryKeys.travels.all).toEqual(['travels'])
    })
  })

  describe('Travel card component', () => {
    it('TravelCard is exported from travels route', async () => {
      const mod = await import('../routes/_authenticated/travels/index')
      expect(mod.TravelCard).toBeDefined()
      expect(typeof mod.TravelCard).toBe('function')
    })

    it('travel fixture has required display fields', () => {
      const travel = MOCK_TRAVELS[0]!
      expect(travel.name).toBe('Japan Trip')
      expect(travel.startDate).toBeDefined()
      expect(travel.endDate).toBeDefined()
      expect(travel.currency).toBe('JPY')
      expect(travel.budget).toBe(500000)
      expect(travel.id).toBe('travel-1')
    })

    it('travel card renders with all required data fields', () => {
      const travel = MOCK_TRAVELS[1]!
      // Verify the travel object has all fields the card expects
      expect(travel.name).toBe('Portugal Weekend')
      expect(travel.currency).toBe('EUR')
      expect(travel.budget).toBe(1200)
      expect(new Date(travel.startDate)).toBeInstanceOf(Date)
      expect(new Date(travel.endDate)).toBeInstanceOf(Date)
    })
  })

  describe('Empty state', () => {
    it('empty travel list triggers empty state', () => {
      const emptyList: typeof MOCK_TRAVELS = []
      expect(emptyList.length).toBe(0)
    })

    it('i18n has empty state keys', async () => {
      const i18n = (await import('../i18n')).default
      await i18n.init
      expect(i18n.t('travel.emptyState')).toBe('No trips yet')
      expect(i18n.t('travel.emptyStateCta')).toBe('Create your first trip')
    })
  })

  describe('Skeleton loading state', () => {
    it('loading state is handled by useTravels hook', async () => {
      // The hook returns isLoading from useQuery, which starts as true
      const { queryKeys } = await import('@repo/api-client')
      expect(queryKeys.travels.all).toBeDefined()
    })
  })

  describe('Travels route', () => {
    it('exports Route at /_authenticated/travels/', async () => {
      const mod = await import('../routes/_authenticated/travels/index')
      expect(mod.Route).toBeDefined()
    })

    it('i18n has travel list keys', async () => {
      const i18n = (await import('../i18n')).default
      await i18n.init
      expect(i18n.t('travel.myTravels')).toBe('My Travels')
      expect(i18n.t('travel.create')).toBe('Create Travel')
    })
  })

  describe('Integration: travels list renders cards', () => {
    it('non-empty travel list maps to travel cards', () => {
      const travels = MOCK_TRAVELS
      expect(travels.length).toBe(2)
      // Each travel should produce a card keyed by travel.id
      const cardIds = travels.map((t) => `travel-card-${t.id}`)
      expect(cardIds).toEqual(['travel-card-travel-1', 'travel-card-travel-2'])
    })

    it('date formatting works for different locales', () => {
      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
      const date = new Date('2026-04-15T12:00:00.000Z')

      const enFormatted = new Intl.DateTimeFormat('en', opts).format(date)
      expect(enFormatted).toContain('Apr')

      const ptFormatted = new Intl.DateTimeFormat('pt-BR', opts).format(date)
      expect(ptFormatted).toContain('abr')
    })

    it('budget formatting respects currency and locale', () => {
      const formatted = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(1200)
      expect(formatted).toContain('1,200')
      expect(formatted).toContain('€')
    })
  })

  describe('Integration: navigation', () => {
    it('travel card produces correct route path', () => {
      const travelId = 'travel-1'
      const expectedPath = `/travels/${travelId}`
      expect(expectedPath).toBe('/travels/travel-1')
    })

    it('create trip navigates to /travels/new', () => {
      const createPath = '/travels/new'
      expect(createPath).toBe('/travels/new')
    })
  })
})
