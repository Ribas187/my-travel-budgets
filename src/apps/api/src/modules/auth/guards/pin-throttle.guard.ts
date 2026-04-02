import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class PinThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const body = req.body as { email?: string } | undefined;
    return body?.email ?? 'unknown';
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
