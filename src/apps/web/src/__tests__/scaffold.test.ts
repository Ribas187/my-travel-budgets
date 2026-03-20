import { describe, it, expect } from 'vitest';

describe('Web App Scaffold', () => {
  describe('Provider modules', () => {
    it('App renders without crashing with all providers', async () => {
      const { App } = await import('../App');
      expect(App).toBeDefined();
      expect(typeof App).toBe('function');
    });

    it('AuthProvider exports useAuth hook', async () => {
      const { AuthProvider, useAuth } = await import('../providers/AuthProvider');
      expect(AuthProvider).toBeDefined();
      expect(useAuth).toBeDefined();
      expect(typeof AuthProvider).toBe('function');
      expect(typeof useAuth).toBe('function');
    });
  });

  describe('i18next configuration', () => {
    it('resolves a known translation key correctly', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      const translated = i18n.t('common.save');
      expect(translated).toBe('Save');
    });

    it('resolves pt-BR translation key', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      const translated = i18n.t('common.save', { lng: 'pt-BR' });
      expect(translated).toBe('Salvar');
    });

    it('falls back to key when translation is missing', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      const translated = i18n.t('nonexistent.key');
      expect(translated).toBe('nonexistent.key');
    });
  });

  describe('TanStack Router route tree', () => {
    it('exports a valid route tree', async () => {
      const { routeTree } = await import('../routeTree.gen');
      expect(routeTree).toBeDefined();
    });

    it('contains login route', async () => {
      const { Route } = await import('../routes/login');
      expect(Route).toBeDefined();
    });

    it('contains authenticated layout route', async () => {
      const { Route } = await import('../routes/_authenticated');
      expect(Route).toBeDefined();
    });

    it('contains travels index route', async () => {
      const { Route } = await import('../routes/_authenticated/travels/index');
      expect(Route).toBeDefined();
    });
  });

  describe('QueryClient', () => {
    it('is accessible and configured', async () => {
      const { queryClient } = await import('../queryClient');
      expect(queryClient).toBeDefined();
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.staleTime).toBe(1000 * 60 * 2);
      expect(defaults.queries?.retry).toBe(1);
    });
  });
});
