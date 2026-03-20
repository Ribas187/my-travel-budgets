import type { ExecutionContext } from '@nestjs/common';

import type { JwtAuthUser } from './jwt-session.types';

/**
 * Policy interface for domain-specific authorization checks.
 * Implement this in domain modules (e.g., TravelOwnerPolicy, TravelMemberPolicy)
 * to enforce access rules beyond simple authentication.
 */
export interface Policy {
  check(user: JwtAuthUser, context: ExecutionContext): Promise<boolean>;
}
