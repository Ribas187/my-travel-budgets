import { describe, it, expect } from 'vitest'
import { Heading, Body, Caption, Label } from '../Typography'

describe('Typography Components', () => {
  describe('Heading', () => {
    it('is defined and is a styled component', () => {
      expect(Heading).toBeDefined()
      expect(Heading.staticConfig).toBeDefined()
    })

    it('uses Fredoka font family', () => {
      // staticConfig holds the parsed style info from styled()
      const staticConfig = Heading.staticConfig
      expect(staticConfig).toBeDefined()
      expect(staticConfig.defaultProps?.fontFamily).toBe('$heading')
    })

    it('has level variants defined', () => {
      const variants = Heading.staticConfig?.variants
      expect(variants).toBeDefined()
      expect(variants?.level).toBeDefined()
    })
  })

  describe('Body', () => {
    it('is defined and is a styled component', () => {
      expect(Body).toBeDefined()
      expect(Body.staticConfig).toBeDefined()
    })

    it('uses Nunito font family', () => {
      const staticConfig = Body.staticConfig
      expect(staticConfig).toBeDefined()
      expect(staticConfig.defaultProps?.fontFamily).toBe('$body')
    })

    it('has size variants defined', () => {
      const variants = Body.staticConfig?.variants
      expect(variants).toBeDefined()
      expect(variants?.size).toBeDefined()
    })
  })

  describe('Caption', () => {
    it('is defined and is a styled component', () => {
      expect(Caption).toBeDefined()
      expect(Caption.staticConfig).toBeDefined()
    })

    it('uses Nunito font family (via $body)', () => {
      const staticConfig = Caption.staticConfig
      expect(staticConfig).toBeDefined()
      expect(staticConfig.defaultProps?.fontFamily).toBe('$body')
    })

    it('has strong variant defined', () => {
      const variants = Caption.staticConfig?.variants
      expect(variants).toBeDefined()
      expect(variants?.strong).toBeDefined()
    })
  })

  describe('Label', () => {
    it('is defined and is a styled component', () => {
      expect(Label).toBeDefined()
      expect(Label.staticConfig).toBeDefined()
    })

    it('uses Nunito font family (via $body)', () => {
      const staticConfig = Label.staticConfig
      expect(staticConfig).toBeDefined()
      expect(staticConfig.defaultProps?.fontFamily).toBe('$body')
    })
  })
})
