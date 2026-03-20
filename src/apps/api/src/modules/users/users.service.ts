import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/modules/prisma/prisma.service'
import type { UserMeDto } from './dto/user-me.dto'
import type { UpdateMeDto } from './dto/update-me.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserMeDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async updateMe(userId: string, input: UpdateMeDto): Promise<UserMeDto> {
    const data: { name?: string; avatarUrl?: string } = {}
    if (input.name !== undefined) data.name = input.name
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
