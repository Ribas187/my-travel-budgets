import type { ExecutionContext } from '@nestjs/common';

import { IsAuthenticatedPolicy } from './is-authenticated.policy';

describe('IsAuthenticatedPolicy', () => {
  const policy = new IsAuthenticatedPolicy();
  const context = {} as ExecutionContext;

  it('returns true when user has userId', async () => {
    const user = { userId: 'user-1', email: 'a@test.com' };
    expect(await policy.check(user, context)).toBe(true);
  });

  it('returns false when user has no userId', async () => {
    const user = { userId: '', email: 'a@test.com' };
    expect(await policy.check(user, context)).toBe(false);
  });

  it('returns false when user is null/undefined', async () => {
    expect(await policy.check(null as never, context)).toBe(false);
    expect(await policy.check(undefined as never, context)).toBe(false);
  });
});
