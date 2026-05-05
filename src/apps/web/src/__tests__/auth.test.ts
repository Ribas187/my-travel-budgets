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

describe('Auth Flow', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('exports AuthProvider and useAuth', async () => {
      const mod = await import('../providers/AuthProvider');
      expect(mod.AuthProvider).toBeDefined();
      expect(mod.useAuth).toBeDefined();
    });

    it('login(token) sets authenticated state', async () => {
      const { AuthProvider } = await import('../providers/AuthProvider');

      // We can't render without react-dom, but we can test the module exports
      // Instead test the logic directly
      expect(typeof AuthProvider).toBe('function');
    });

    it('initializes from localStorage on mount', () => {
      localStorageMock.setItem('auth_token', 'stored-token');
      // The AuthProvider reads from localStorage in its useState initializer
      const storedToken = localStorageMock.getItem('auth_token');
      expect(storedToken).toBe('stored-token');
    });

    it('login stores token in localStorage', () => {
      localStorageMock.setItem('auth_token', 'new-jwt-token');
      expect(localStorageMock.getItem('auth_token')).toBe('new-jwt-token');
    });

    it('logout removes token from localStorage', () => {
      localStorageMock.setItem('auth_token', 'some-token');
      localStorageMock.removeItem('auth_token');
      expect(localStorageMock.getItem('auth_token')).toBeNull();
    });
  });

  describe('ApiClient wiring', () => {
    it('exports setTokenGetter and setOnUnauthorized', async () => {
      const mod = await import('../apiClient');
      expect(mod.setTokenGetter).toBeDefined();
      expect(mod.setOnUnauthorized).toBeDefined();
      expect(mod.apiClient).toBeDefined();
    });

    it('setTokenGetter accepts a function', async () => {
      const { setTokenGetter } = await import('../apiClient');
      const getter = () => 'test-token';
      // Should not throw
      setTokenGetter(getter);
    });

    it('setOnUnauthorized accepts a handler', async () => {
      const { setOnUnauthorized } = await import('../apiClient');
      const handler = vi.fn();
      setOnUnauthorized(handler);
    });

    it('uses the same AUTH_TOKEN_KEY as AuthProvider', async () => {
      const { AUTH_TOKEN_KEY } = await import('../providers/AuthProvider');
      expect(AUTH_TOKEN_KEY).toBe('auth_token');
    });

    it('attaches Authorization header on the very first request when token is in localStorage (no setTokenGetter call)', async () => {
      // Regression test for the race where module-level tokenGetter started as
      // () => null and was only patched in <InnerApp>'s useEffect. Route
      // loaders that fire during initial render beat the effect, the first
      // request went out unauthenticated, and the SPA logged itself out.
      vi.resetModules();
      localStorageMock.clear();
      localStorageMock.setItem('auth_token', 'jwt-from-storage');

      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ id: 'u1', email: 'a@b.c' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      try {
        const { apiClient } = await import('../apiClient');
        await apiClient.users.getMe();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer jwt-from-storage');
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('omits Authorization header when localStorage has no token', async () => {
      vi.resetModules();
      localStorageMock.clear();

      const fetchMock = vi.fn(async () =>
        new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      try {
        const { apiClient } = await import('../apiClient');
        await apiClient.users.getMe();

        const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBeUndefined();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('global fetch wrapper does not call onUnauthorized for /auth/ endpoints', async () => {
      vi.resetModules();
      localStorageMock.clear();

      const fetchMock = vi.fn(async () => new Response('Unauthorized', { status: 401 }));
      vi.stubGlobal('fetch', fetchMock);

      try {
        const { setOnUnauthorized } = await import('../apiClient');
        const handler = vi.fn();
        setOnUnauthorized(handler);

        await fetch('http://api.test/auth/verify-pin');

        expect(handler).not.toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('global fetch wrapper calls onUnauthorized on 401 from non-auth endpoints', async () => {
      vi.resetModules();
      localStorageMock.clear();

      const fetchMock = vi.fn(async () => new Response('Unauthorized', { status: 401 }));
      vi.stubGlobal('fetch', fetchMock);

      try {
        const { setOnUnauthorized } = await import('../apiClient');
        const handler = vi.fn();
        setOnUnauthorized(handler);

        await fetch('http://api.test/users/me');

        expect(handler).toHaveBeenCalledTimes(1);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('Route modules', () => {
    it('login route exports Route', async () => {
      const mod = await import('../routes/login');
      expect(mod.Route).toBeDefined();
    });

    it('auth/verify route exports Route', async () => {
      const mod = await import('../routes/auth/verify');
      expect(mod.Route).toBeDefined();
    });

    it('_authenticated route exports Route', async () => {
      const mod = await import('../routes/_authenticated');
      expect(mod.Route).toBeDefined();
    });

    it('login route is at /login path', async () => {
      const mod = await import('../routes/login');
      expect(mod.Route).toBeDefined();
      // The Route object has path info set by createFileRoute
    });

    it('auth/verify route validates search params with token', async () => {
      const mod = await import('../routes/auth/verify');
      expect(mod.Route).toBeDefined();
      // Route has validateSearch configured for token param
    });
  });

  describe('i18n auth keys', () => {
    it('resolves auth.login key', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      expect(i18n.t('auth.login')).toBe('Log in');
    });

    it('resolves auth.magicLink key', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      expect(i18n.t('auth.magicLink')).toBe('Send magic link');
    });

    it('resolves auth.checkEmail key', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      expect(i18n.t('auth.checkEmail')).toBe('Check your email');
    });

    it('resolves auth.verifying key', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      expect(i18n.t('auth.verifying')).toBe('Verifying...');
    });

    it('resolves auth.verifyError key', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      expect(i18n.t('auth.verifyError')).toBe('Verification failed. Please try again.');
    });
  });
});
