import { SetMetadata } from '@nestjs/common'
import type { Policy } from './policy.interface'

export const CHECK_POLICY_KEY = 'check_policy'

/**
 * Decorator to apply a policy to a controller method.
 * Use with PolicyGuard: @UseGuards(JwtAuthGuard, PolicyGuard) @CheckPolicy(SomePolicy)
 */
export const CheckPolicy = (policy: new (...args: unknown[]) => Policy) =>
  SetMetadata(CHECK_POLICY_KEY, policy)
