import { Injectable, NotFoundException } from '@nestjs/common';

import type { UserMeDto } from './dto/user-me.dto';
import type { UpdateMeDto } from './dto/update-me.dto';
import type { SetMainTravelDto } from './dto/set-main-travel.dto';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toUserMeDto(user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    mainTravelId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserMeDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      mainTravelId: user.mainTravelId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getMe(userId: string): Promise<UserMeDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserMeDto(user);
  }

  async updateMe(userId: string, input: UpdateMeDto): Promise<UserMeDto> {
    const data: { name?: string; avatarUrl?: string } = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toUserMeDto(user);
  }

  async setMainTravel(userId: string, dto: SetMainTravelDto): Promise<UserMeDto> {
    if (dto.travelId !== null) {
      const membership = await this.prisma.travelMember.findFirst({
        where: {
          travelId: dto.travelId,
          userId,
        },
      });

      if (!membership) {
        throw new NotFoundException('Travel not found');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { mainTravelId: dto.travelId },
    });

    return this.toUserMeDto(user);
  }
}
