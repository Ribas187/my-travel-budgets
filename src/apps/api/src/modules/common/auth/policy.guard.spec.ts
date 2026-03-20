import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import type { Policy } from './policy.interface';
import { CHECK_POLICY_KEY } from './check-policy.decorator';
import { PolicyGuard } from './policy.guard';
import { IsAuthenticatedPolicy } from './is-authenticated.policy';

class DenyPolicy implements Policy {
  async check(
    _user: { userId: string; email: string },
    _context: ExecutionContext,
  ): Promise<boolean> {
    return false;
  }
}

class AllowPolicy implements Policy {
  async check(
    _user: { userId: string; email: string },
    _context: ExecutionContext,
  ): Promise<boolean> {
    return true;
  }
}

const createMockContext = (user: { userId: string; email: string } | undefined) => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
};

describe('PolicyGuard', () => {
  let guard: PolicyGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolicyGuard, Reflector],
    }).compile();

    guard = module.get(PolicyGuard);
    reflector = module.get(Reflector);
  });

  it('calls the correct policy check method', async () => {
    const checkSpy = jest.spyOn(AllowPolicy.prototype, 'check');
    reflector.getAllAndOverride = jest.fn().mockReturnValue(AllowPolicy);

    const context = createMockContext({ userId: 'u1', email: 'a@test.com' });
    await guard.canActivate(context);

    expect(checkSpy).toHaveBeenCalledWith({ userId: 'u1', email: 'a@test.com' }, context);
  });

  it('returns 403 when policy denies access', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(DenyPolicy);
    const context = createMockContext({ userId: 'u1', email: 'a@test.com' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('allows request when policy grants access', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(AllowPolicy);
    const context = createMockContext({ userId: 'u1', email: 'a@test.com' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('allows request when no policy is set', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
    const context = createMockContext({ userId: 'u1', email: 'a@test.com' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when user is missing', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(IsAuthenticatedPolicy);
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
