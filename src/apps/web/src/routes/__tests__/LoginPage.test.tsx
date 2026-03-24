import { describe, it, expect, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => ({ component: null }),
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: false, token: null, logout: vi.fn() }),
}));

vi.mock('@/apiClient', () => ({
  apiClient: { auth: { requestMagicLink: vi.fn() } },
}));

describe('LoginPage email input height', () => {
  it('email input has minHeight of 48', async () => {
    // Read the source to verify minHeight={48} is set on the login email Input
    const { readFileSync } = await import('fs');
    const source = readFileSync(
      new URL('../../routes/login.tsx', import.meta.url).pathname,
      'utf-8',
    );
    // The Input component should have minHeight={48}
    expect(source).toContain('minHeight={48}');
  });
});
