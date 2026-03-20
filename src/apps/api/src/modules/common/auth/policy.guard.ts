import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Policy } from './policy.interface'
import { CHECK_POLICY_KEY } from './check-policy.decorator'
import type { JwtAuthUser } from './jwt-session.types'

/**
 * Guard that executes the policy associated with the route via @CheckPolicy.
 * Must be used after JwtAuthGuard so the user is already authenticated.
 * Returns 403 Forbidden when the policy's check returns false.
 */
@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const PolicyClass = this.reflector.getAllAndOverride<new (...args: unknown[]) => Policy>(
      CHECK_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!PolicyClass) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as JwtAuthUser | undefined

    if (!user) {
      throw new ForbiddenException()
    }

    const policy = new PolicyClass()
    const allowed = await policy.check(user, context)

    if (!allowed) {
      throw new ForbiddenException()
    }

    return true
  }
}
