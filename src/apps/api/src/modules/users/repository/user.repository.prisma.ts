import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

import type { IUserRepository } from './user.repository.interface';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(
    id: string,
    data: Partial<Pick<User, 'name' | 'avatarUrl' | 'mainTravelId'>>,
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async isMemberOfTravel(userId: string, travelId: string): Promise<boolean> {
    const membership = await this.prisma.travelMember.findFirst({
      where: { travelId, userId },
    });
    return membership !== null;
  }
}
