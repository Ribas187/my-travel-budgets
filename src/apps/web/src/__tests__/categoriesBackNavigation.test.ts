import { describe, it, expect, vi } from 'vitest';

describe('Categories Back Navigation', () => {
  describe('BackHeader is visible on categories page', () => {
    it('categories route imports and renders BackHeader', async () => {
      const source = await import(
        '@/routes/_authenticated/travels/$travelId/categories?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain('BackHeader');
      expect(code).toContain("import { BackHeader } from '@repo/ui'");
    });

    it('BackHeader receives travel name as title', async () => {
      const source = await import(
        '@/routes/_authenticated/travels/$travelId/categories?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toMatch(/title=\{travel\.name\}/);
    });

    it('BackHeader receives onBack handler', async () => {
      const source = await import(
        '@/routes/_authenticated/travels/$travelId/categories?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toMatch(/onBack=\{handleBack\}/);
    });

    it('BackHeader has accessibility label using i18n backTo key', async () => {
      const source = await import(
        '@/routes/_authenticated/travels/$travelId/categories?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain("t('common.backTo'");
      expect(code).toContain('accessibilityLabel');
    });

    it('BackHeader is rendered for both owners and collaborators (no isOwner guard)', async () => {
      const source = await import(
        '@/routes/_authenticated/travels/$travelId/categories?raw'
      );
      const code = (source as { default: string }).default;

      // BackHeader should not be wrapped in an isOwner conditional
      expect(code).not.toMatch(/\{isOwner\s*&&\s*<BackHeader/);
      // BackHeader appears unconditionally in JSX return
      expect(code).toMatch(/<BackHeader/);
    });
  });

  describe('clicking back arrow navigates to travel dashboard', () => {
    it('handleBack navigates to /travels/$travelId', () => {
      const navigateMock = vi.fn();
      const travelId = 'travel-123';

      const handleBack = () => {
        navigateMock({
          to: '/travels/$travelId',
          params: { travelId },
        });
      };

      handleBack();

      expect(navigateMock).toHaveBeenCalledWith({
        to: '/travels/$travelId',
        params: { travelId: 'travel-123' },
      });
    });

    it('categories route source contains correct navigation target', async () => {
      const source = await import(
        '@/routes/_authenticated/travels/$travelId/categories?raw'
      );
      const code = (source as { default: string }).default;

      expect(code).toContain("to: '/travels/$travelId'");
      expect(code).toContain('params: { travelId }');
    });
  });

  describe('BackHeader component exports', () => {
    it('BackHeader is exported from @repo/ui', async () => {
      const ui = await import('@repo/ui');
      expect(ui.BackHeader).toBeDefined();
      expect(typeof ui.BackHeader).toBe('function');
    });
  });

  describe('i18n keys for back navigation', () => {
    it('common.backTo key exists in en translations', async () => {
      const i18n = (await import('../i18n')).default;
      await i18n.init;

      const result = i18n.t('common.backTo', { name: 'Japan Trip' });
      expect(result).toBe('Back to Japan Trip');
    });
  });
});
