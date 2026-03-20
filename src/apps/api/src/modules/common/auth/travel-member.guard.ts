import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { JwtAuthUser } from './jwt-session.types';

import type { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class TravelMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtAuthUser = request.user;
    const travelId = request.params.travelId ?? request.params.id;

    const member = await this.prisma.travelMember.findFirst({
      where: { travelId, userId: user.userId },
    });

    if (!member) throw new ForbiddenException('Not a member of this travel');
    request.travelMember = member;
    return true;
  }
}
