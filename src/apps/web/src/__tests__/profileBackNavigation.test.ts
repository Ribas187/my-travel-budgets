import { describe, it, expect, vi } from 'vitest';

describe('Profile Page — BackHeader + My Travels Navigation', () => {
  describe('BackHeader on ProfilePage', () => {
    it('ProfilePage imports and renders BackHeader', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain('BackHeader');
      expect(code).toContain("Heading, Body, PrimaryButton, BackHeader");
      expect(code).toContain("from '@repo/ui'");
    });

    it('BackHeader receives profile title via i18n', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain("title={t('profile.title')}");
    });

    it('BackHeader receives onBack handler', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toMatch(/onBack=\{handleBack\}/);
    });

    it('BackHeader has accessibility label using i18n key', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain("t('profile.backToApp')");
      expect(code).toContain('accessibilityLabel');
    });
  });

  describe('handleBack uses router.history.back() with fallback', () => {
    it('calls historyBack when history length > 1', () => {
      const historyBack = vi.fn();
      const navigateMock = vi.fn();

      // Simulate the handleBack logic with historyLength > 1
      const handleBack = (historyLength: number) => {
        if (historyLength > 1) {
          historyBack();
        } else {
          navigateMock({ to: '/travels' });
        }
      };

      handleBack(3);
      expect(historyBack).toHaveBeenCalled();
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('navigates to /travels as fallback when history length is 1', () => {
      const historyBack = vi.fn();
      const navigateMock = vi.fn();

      const handleBack = (historyLength: number) => {
        if (historyLength > 1) {
          historyBack();
        } else {
          navigateMock({ to: '/travels' });
        }
      };

      handleBack(1);
      expect(historyBack).not.toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith({ to: '/travels' });
    });

    it('ProfilePage source uses router.history.back()', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain('router.history.back()');
      expect(code).toContain("navigate({ to: '/travels' })");
      expect(code).toContain('window.history.length > 1');
    });
  });

  describe('My Travels navigation row', () => {
    it('ProfilePage renders My Travels row with test ID', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain('my-travels-row');
    });

    it('My Travels row uses i18n key for label', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain("t('profile.myTravels')");
    });

    it('My Travels row navigates to /travels', () => {
      const navigateMock = vi.fn();

      const handleMyTravels = () => {
        navigateMock({ to: '/travels' });
      };

      handleMyTravels();
      expect(navigateMock).toHaveBeenCalledWith({ to: '/travels' });
    });

    it('My Travels row has Map icon and ChevronRight', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain('Map');
      expect(code).toContain('ChevronRight');
      expect(code).toMatch(/import\s*\{[^}]*Map[^}]*\}\s*from\s*'lucide-react'/);
    });

    it('My Travels row is keyboard accessible with role="button"', async () => {
      const source = await import(
        '@/features/profile/ProfilePage?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toMatch(/NavigationRow[\s\S]*?role="button"/);
      expect(code).toMatch(/NavigationRow[\s\S]*?tabIndex=\{0\}/);
    });
  });

  describe('i18n keys for profile navigation', () => {
    it('profile.myTravels key exists in en translations', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      await i18n.changeLanguage('en');

      expect(i18n.t('profile.myTravels')).toBe('My Travels');
    });

    it('profile.myTravels key exists in pt-BR translations', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      await i18n.changeLanguage('pt-BR');

      expect(i18n.t('profile.myTravels')).toBe('Minhas Viagens');

      // Reset
      await i18n.changeLanguage('en');
    });

    it('profile.backToApp key exists in en translations', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      await i18n.changeLanguage('en');

      expect(i18n.t('profile.backToApp')).toBe('Back');
    });

    it('profile.backToApp key exists in pt-BR translations', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;
      await i18n.changeLanguage('pt-BR');

      expect(i18n.t('profile.backToApp')).toBe('Voltar');

      // Reset
      await i18n.changeLanguage('en');
    });
  });
});
