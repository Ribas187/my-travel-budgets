import type { ExecutionContext } from '@nestjs/common';

import type { Policy } from './policy.interface';
import type { JwtAuthUser } from './jwt-session.types';

export class IsTravelOwnerPolicy implements Policy {
  async check(_user: JwtAuthUser, context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return request.travelMember?.role === 'owner';
  }
}
