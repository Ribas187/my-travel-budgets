import type { ExecutionContext } from '@nestjs/common'
import type { Policy } from './policy.interface'
import type { JwtAuthUser } from './jwt-session.types'

/**
 * Example policy that always allows access when the user is authenticated.
 * Used to validate the authorization framework works end-to-end.
 * JwtAuthGuard ensures the user exists; this policy simply returns true.
 */
export class IsAuthenticatedPolicy implements Policy {
  async check(user: JwtAuthUser, _context: ExecutionContext): Promise<boolean> {
    return !!user?.userId
  }
}
