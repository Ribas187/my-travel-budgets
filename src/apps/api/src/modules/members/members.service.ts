import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { AddMemberDto } from './dto/add-member.dto';

import type { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async addMember(travelId: string, dto: AddMemberDto) {
    if (dto.email) {
      return this.addByEmail(travelId, dto.email);
    }

    return this.addGuest(travelId, dto.guestName!);
  }

  async removeMember(travelId: string, memberId: string) {
    const member = await this.prisma.travelMember.findFirst({
      where: { id: memberId, travelId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new BadRequestException('Cannot remove the travel owner');
    }

    await this.prisma.travelMember.delete({
      where: { id: memberId },
    });
  }

  private async addByEmail(travelId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found. You can add them as a named guest instead.');
    }

    try {
      return await this.prisma.travelMember.create({
        data: {
          travelId,
          userId: user.id,
          role: 'member',
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('User is already a member of this travel');
      }
      throw error;
    }
  }

  private async addGuest(travelId: string, guestName: string) {
    return this.prisma.travelMember.create({
      data: {
        travelId,
        guestName,
        role: 'member',
      },
    });
  }
}
