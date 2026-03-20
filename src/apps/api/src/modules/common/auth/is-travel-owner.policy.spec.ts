import type { ExecutionContext } from '@nestjs/common'
import { IsTravelOwnerPolicy } from './is-travel-owner.policy'

const createMockContext = (travelMember: { role: string } | undefined) => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ travelMember }),
    }),
  } as unknown as ExecutionContext
}

describe('IsTravelOwnerPolicy', () => {
  const policy = new IsTravelOwnerPolicy()
  const user = { userId: 'user-1', email: 'a@test.com' }

  it('returns true when travelMember role is owner', async () => {
    const context = createMockContext({ role: 'owner' })
    expect(await policy.check(user, context)).toBe(true)
  })

  it('returns false when travelMember role is member', async () => {
    const context = createMockContext({ role: 'member' })
    expect(await policy.check(user, context)).toBe(false)
  })

  it('returns false when travelMember is undefined', async () => {
    const context = createMockContext(undefined)
    expect(await policy.check(user, context)).toBe(false)
  })
})
