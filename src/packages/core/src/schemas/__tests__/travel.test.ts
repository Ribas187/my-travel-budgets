import { describe, it, expect } from 'vitest'
import { createTravelSchema, updateTravelSchema } from '../travel'

describe('Travel schemas', () => {
  it('validates a valid create travel payload', () => {
    const result = createTravelSchema.safeParse({
      name: 'Paris Trip',
      currency: 'EUR',
      budget: 3000,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = createTravelSchema.safeParse({
      name: 'Paris Trip',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid currency code', () => {
    const result = createTravelSchema.safeParse({
      name: 'Trip',
      currency: 'INVALID',
      budget: 1000,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative budget', () => {
    const result = createTravelSchema.safeParse({
      name: 'Trip',
      currency: 'USD',
      budget: -100,
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })
    expect(result.success).toBe(false)
  })

  it('validates update with optional fields', () => {
    const result = updateTravelSchema.safeParse({
      name: 'Updated Name',
      imageUrl: 'https://example.com/photo.jpg',
    })
    expect(result.success).toBe(true)
  })
})
