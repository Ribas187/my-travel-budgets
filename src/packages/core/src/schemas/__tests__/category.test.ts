import { describe, it, expect } from 'vitest'
import { createCategorySchema, updateCategorySchema } from '../category'

describe('Category schemas', () => {
  it('validates a valid create category payload', () => {
    const result = createCategorySchema.safeParse({
      name: 'Food',
      icon: 'utensils',
      color: '#FF5733',
    })
    expect(result.success).toBe(true)
  })

  it('validates create with optional budgetLimit', () => {
    const result = createCategorySchema.safeParse({
      name: 'Transport',
      icon: 'car',
      color: '#3498DB',
      budgetLimit: 500,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative budgetLimit', () => {
    const result = createCategorySchema.safeParse({
      name: 'Food',
      icon: 'utensils',
      color: '#FF5733',
      budgetLimit: -10,
    })
    expect(result.success).toBe(false)
  })

  it('validates update with partial fields', () => {
    const result = updateCategorySchema.safeParse({
      budgetLimit: 200,
    })
    expect(result.success).toBe(true)
  })
})
