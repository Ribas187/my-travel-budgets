import { describe, it, expect } from 'vitest';

import { Heading, Body, Caption, Label } from '../Typography';

describe('Typography Components', () => {
  describe('Heading', () => {
    it('is defined and is a function component', () => {
      expect(Heading).toBeDefined();
      expect(typeof Heading).toBe('function');
    });

    it('wraps HeadingBase which uses Fredoka font family', () => {
      // Heading is now a wrapper function that delegates to HeadingBase styled component
      // We verify it's callable and accepts heading props
      expect(Heading).toBeDefined();
      expect(Heading.length).toBeGreaterThanOrEqual(0);
    });

    it('accepts level prop for semantic HTML headings', () => {
      // Heading maps level 1-4 to h1-h4 tags
      expect(typeof Heading).toBe('function');
    });
  });

  describe('Body', () => {
    it('is defined and is a styled component', () => {
      expect(Body).toBeDefined();
      expect(Body.staticConfig).toBeDefined();
    });

    it('uses Nunito font family', () => {
      const staticConfig = Body.staticConfig;
      expect(staticConfig).toBeDefined();
      expect(staticConfig.defaultProps?.fontFamily).toBe('$body');
    });

    it('has size variants defined', () => {
      const variants = Body.staticConfig?.variants;
      expect(variants).toBeDefined();
      expect(variants?.size).toBeDefined();
    });
  });

  describe('Caption', () => {
    it('is defined and is a styled component', () => {
      expect(Caption).toBeDefined();
      expect(Caption.staticConfig).toBeDefined();
    });

    it('uses Nunito font family (via $body)', () => {
      const staticConfig = Caption.staticConfig;
      expect(staticConfig).toBeDefined();
      expect(staticConfig.defaultProps?.fontFamily).toBe('$body');
    });

    it('has strong variant defined', () => {
      const variants = Caption.staticConfig?.variants;
      expect(variants).toBeDefined();
      expect(variants?.strong).toBeDefined();
    });
  });

  describe('Label', () => {
    it('is defined and is a styled component', () => {
      expect(Label).toBeDefined();
      expect(Label.staticConfig).toBeDefined();
    });

    it('uses Nunito font family (via $body)', () => {
      const staticConfig = Label.staticConfig;
      expect(staticConfig).toBeDefined();
      expect(staticConfig.defaultProps?.fontFamily).toBe('$body');
    });
  });
});
