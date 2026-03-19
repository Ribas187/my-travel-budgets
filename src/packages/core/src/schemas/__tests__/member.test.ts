import { describe, it, expect } from 'vitest'
import { addMemberSchema } from '../member'

describe('Member schemas', () => {
  it('validates adding a registered member by email', () => {
    const result = addMemberSchema.safeParse({
      email: 'friend@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('validates adding a guest by name', () => {
    const result = addMemberSchema.safeParse({
      guestName: 'Bob',
    })
    expect(result.success).toBe(true)
  })

  it('rejects payload with both email and guestName', () => {
    const result = addMemberSchema.safeParse({
      email: 'friend@example.com',
      guestName: 'Bob',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty payload', () => {
    const result = addMemberSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
