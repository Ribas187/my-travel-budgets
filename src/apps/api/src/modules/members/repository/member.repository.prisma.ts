import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { TravelMember, User } from '@prisma/client';

import type { IMemberRepository } from './member.repository.interface';

import { ConflictError } from '@/modules/common/exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PrismaMemberRepository implements IMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findByIdAndTravel(id: string, travelId: string): Promise<TravelMember | null> {
    return this.prisma.travelMember.findFirst({
      where: { id, travelId },
    });
  }

  async createMember(data: {
    travelId: string;
    userId?: string;
    guestName?: string;
    role: string;
  }): Promise<TravelMember> {
    try {
      return await this.prisma.travelMember.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('User is already a member of this travel');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.travelMember.delete({ where: { id } });
  }
}
