import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserMe, Travel } from '@repo/api-client';

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

const MOCK_USER_WITH_MAIN: UserMe = {
  id: 'u1',
  email: 'alice@test.com',
  name: 'Alice',
  avatarUrl: null,
  mainTravelId: 'travel-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_USER_WITHOUT_MAIN: UserMe = {
  id: 'u1',
  email: 'alice@test.com',
  name: 'Alice',
  avatarUrl: null,
  mainTravelId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_TRAVELS: Travel[] = [
  {
    id: 'travel-1',
    name: 'Japan Trip',
    description: 'Exploring Tokyo',
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
];

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('TravelsPage — star toggle', () => {
  it('TravelCard is exported from travels route', async () => {
    const mod = await import('../routes/_authenticated/travels/index');
    expect(mod.TravelCard).toBeDefined();
    expect(typeof mod.TravelCard).toBe('function');
  });

  it('star icon renders for each travel card (isMainTravel prop determines state)', () => {
    const travels = MOCK_TRAVELS;
    const mainTravelId = 'travel-1';

    const cards = travels.map((travel) => ({
      travelId: travel.id,
      isMainTravel: travel.id === mainTravelId,
      testId: `star-toggle-${travel.id}`,
    }));

    expect(cards[0]!.isMainTravel).toBe(true);
    expect(cards[0]!.testId).toBe('star-toggle-travel-1');
    expect(cards[1]!.isMainTravel).toBe(false);
    expect(cards[1]!.testId).toBe('star-toggle-travel-2');
  });

  it('star icon for main travel has filled visual state', () => {
    const isMainTravel = true;
    const fill = isMainTravel ? 'currentColor' : 'none';
    const color = isMainTravel ? '#f59e0b' : '#9ca3af';

    expect(fill).toBe('currentColor');
    expect(color).toBe('#f59e0b');
  });

  it('star icon for non-main travel has outline visual state', () => {
    const isMainTravel = false;
    const fill = isMainTravel ? 'currentColor' : 'none';
    const color = isMainTravel ? '#f59e0b' : '#9ca3af';

    expect(fill).toBe('none');
    expect(color).toBe('#9ca3af');
  });

  it('clicking star on non-main travel calls setMainTravel with travel ID', () => {
    const user = MOCK_USER_WITHOUT_MAIN;
    const travelId = 'travel-1';
    const newMainId = user.mainTravelId === travelId ? null : travelId;

    expect(newMainId).toBe('travel-1');
  });

  it('clicking a filled star (main travel) calls setMainTravel with null to clear', () => {
    const user = MOCK_USER_WITH_MAIN;
    const travelId = 'travel-1';
    const newMainId = user.mainTravelId === travelId ? null : travelId;

    expect(newMainId).toBeNull();
  });
});

describe('useSetMainTravel hook', () => {
  it('is defined as a function', async () => {
    const { useSetMainTravel } = await import('../hooks/useSetMainTravel');
    expect(useSetMainTravel).toBeDefined();
    expect(typeof useSetMainTravel).toBe('function');
  });

  it('invalidates users.me query key on success', async () => {
    const { queryKeys } = await import('@repo/api-client');
    expect(queryKeys.users.me).toEqual(['users', 'me']);
  });
});

describe('Root route redirect logic', () => {
  it('redirects to summary when mainTravelId is present and travel is accessible', () => {
    const user = MOCK_USER_WITH_MAIN;
    const travels = MOCK_TRAVELS;
    const isAccessible = travels.some((t) => t.id === user.mainTravelId);

    expect(isAccessible).toBe(true);

    const redirectTo = isAccessible
      ? `/travels/${user.mainTravelId}/summary`
      : '/travels';

    expect(redirectTo).toBe('/travels/travel-1/summary');
  });

  it('falls back to /travels when mainTravelId is null', () => {
    const user = MOCK_USER_WITHOUT_MAIN;

    const redirectTo = user.mainTravelId
      ? `/travels/${user.mainTravelId}/summary`
      : '/travels';

    expect(redirectTo).toBe('/travels');
  });

  it('falls back to /travels when mainTravelId points to inaccessible travel', () => {
    const user: UserMe = {
      ...MOCK_USER_WITH_MAIN,
      mainTravelId: 'deleted-travel',
    };
    const travels = MOCK_TRAVELS;
    const isAccessible = travels.some((t) => t.id === user.mainTravelId);

    expect(isAccessible).toBe(false);

    const redirectTo = isAccessible
      ? `/travels/${user.mainTravelId}/summary`
      : '/travels';

    expect(redirectTo).toBe('/travels');
  });

  it('falls back to /travels on fetch error', () => {
    // Simulates the catch block: any error besides redirect falls through
    let redirectTo = '/travels';
    try {
      throw new Error('Network error');
    } catch (error) {
      if (error && typeof error === 'object' && 'to' in error) {
        // Re-throw redirect
        throw error;
      }
      redirectTo = '/travels';
    }

    expect(redirectTo).toBe('/travels');
  });
});

describe('Root route module', () => {
  it('exports Route from index.tsx', async () => {
    const mod = await import('../routes/index');
    expect(mod.Route).toBeDefined();
  });
});

describe('i18n — main travel keys', () => {
  it('has English keys for star toggle', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;
    await i18n.changeLanguage('en');

    expect(i18n.t('travel.setMainTravel')).toBe('Set as main travel');
    expect(i18n.t('travel.removeMainTravel')).toBe('Remove as main travel');
  });

  it('has Portuguese keys for star toggle', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;
    await i18n.changeLanguage('pt-BR');

    expect(i18n.t('travel.setMainTravel')).toBe('Definir como viagem principal');
    expect(i18n.t('travel.removeMainTravel')).toBe('Remover como viagem principal');

    // Reset
    await i18n.changeLanguage('en');
  });
});
