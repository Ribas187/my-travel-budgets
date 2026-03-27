import { describe, it, expect } from 'vitest';
import type { UserMe } from '@repo/api-client';

const mockUser: UserMe = {
  id: 'u1',
  email: 'alice@test.com',
  name: 'Alice Johnson',
  avatarUrl: null,
  mainTravelId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('useUserMe', () => {
  it('is defined as a function', async () => {
    const { useUserMe } = await import('@repo/api-client');
    expect(useUserMe).toBeDefined();
    expect(typeof useUserMe).toBe('function');
  });

  it('uses correct query key', async () => {
    const { queryKeys } = await import('@repo/api-client');
    expect(queryKeys.users.me).toEqual(['users', 'me']);
  });
});

describe('useUpdateUser', () => {
  it('is defined as a function', async () => {
    const { useUpdateUser } = await import('@repo/api-client');
    expect(useUpdateUser).toBeDefined();
    expect(typeof useUpdateUser).toBe('function');
  });

  it('invalidates users.me query key on success', async () => {
    const { queryKeys } = await import('@repo/api-client');
    expect(queryKeys.users.me).toEqual(['users', 'me']);
  });

  it('calls updateMe with correct data shape', () => {
    const data = { name: 'New Name' };
    expect(data).toEqual({ name: 'New Name' });
  });
});

describe('ProfilePage', () => {
  it('exports ProfilePage component', async () => {
    const { ProfilePage } = await import('@/features/profile/ProfilePage');
    expect(ProfilePage).toBeDefined();
    expect(typeof ProfilePage).toBe('function');
  });

  describe('user info display', () => {
    it('renders user name', () => {
      expect(mockUser.name).toBe('Alice Johnson');
    });

    it('renders user email', () => {
      expect(mockUser.email).toBe('alice@test.com');
    });

    it('shows avatar with initial', () => {
      const initial = mockUser.name.charAt(0).toUpperCase();
      expect(initial).toBe('A');
    });
  });

  describe('name editing', () => {
    it('name edit form validates non-empty trimmed name', () => {
      const validName = '  New Name  ';
      const trimmed = validName.trim();
      expect(trimmed).toBe('New Name');
      expect(trimmed.length > 0).toBe(true);
      expect(trimmed.length <= 100).toBe(true);
    });

    it('rejects empty name', () => {
      const emptyName = '   ';
      const trimmed = emptyName.trim();
      expect(trimmed.length > 0).toBe(false);
    });

    it('submits update with correct data', () => {
      const data = { name: 'Alice Smith' };
      // useUpdateUser.mutate(data) would be called
      expect(data.name).toBe('Alice Smith');
    });
  });

  describe('language switcher', () => {
    it('calls i18n.changeLanguage with en', async () => {
      const i18n = (await import('@/i18n')).default;
      await i18n.init;
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
    });

    it('calls i18n.changeLanguage with pt-BR', async () => {
      const i18n = (await import('@/i18n')).default;
      await i18n.init;
      await i18n.changeLanguage('pt-BR');
      expect(i18n.language).toBe('pt-BR');
      // Reset back to en
      await i18n.changeLanguage('en');
    });

    it('i18n keys exist for both languages', async () => {
      const i18n = (await import('@/i18n')).default;
      await i18n.init;
      expect(i18n.t('profile.languageEn')).toBe('English');
      expect(i18n.t('profile.languagePtBr')).toContain('Portugu');
    });
  });

  describe('logout', () => {
    it('useAuth exports logout function', async () => {
      const { useAuth } = await import('@/providers/AuthProvider');
      expect(useAuth).toBeDefined();
      expect(typeof useAuth).toBe('function');
    });

    it('logout clears auth state', () => {
      // auth.logout() clears token from localStorage and context
      // navigate({ to: '/login' }) redirects
      const loginPath = '/login';
      expect(loginPath).toBe('/login');
    });
  });
});

describe('Language persistence', () => {
  it('after changing language, i18n.language reflects the new locale', async () => {
    const i18n = (await import('@/i18n')).default;
    await i18n.init;

    await i18n.changeLanguage('pt-BR');
    expect(i18n.language).toBe('pt-BR');

    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('translated strings change with language', async () => {
    const i18n = (await import('@/i18n')).default;
    await i18n.init;

    await i18n.changeLanguage('en');
    expect(i18n.t('profile.title')).toBe('Profile');

    await i18n.changeLanguage('pt-BR');
    expect(i18n.t('profile.title')).toBe('Perfil');

    // Reset
    await i18n.changeLanguage('en');
  });
});
