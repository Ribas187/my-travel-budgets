import { describe, it, expect } from 'vitest'
import { createUserSchema, updateUserSchema } from '../user'

describe('User schemas', () => {
  it('validates a valid create user payload', () => {
    const result = createUserSchema.safeParse({
      email: 'test@example.com',
      name: 'John Doe',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = createUserSchema.safeParse({
      email: 'not-an-email',
      name: 'John Doe',
    })
    expect(result.success).toBe(false)
  })

  it('validates update user with optional fields', () => {
    const result = updateUserSchema.safeParse({
      name: 'Jane Doe',
    })
    expect(result.success).toBe(true)
  })

  it('validates update user with avatarUrl', () => {
    const result = updateUserSchema.safeParse({
      avatarUrl: 'https://example.com/avatar.jpg',
    })
    expect(result.success).toBe(true)
  })
})
