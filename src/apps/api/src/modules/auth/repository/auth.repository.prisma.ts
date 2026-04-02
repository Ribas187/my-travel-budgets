import { Injectable } from '@nestjs/common';
import type { LoginPin, MagicLink, User } from '@prisma/client';

import type { IAuthRepository } from './auth.repository.interface';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMagicLink(data: {
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<MagicLink> {
    return this.prisma.magicLink.create({ data });
  }

  findMagicLinkByToken(token: string): Promise<MagicLink | null> {
    return this.prisma.magicLink.findUnique({ where: { token } });
  }

  async consumeMagicLink(token: string): Promise<boolean> {
    const result = await this.prisma.magicLink.updateMany({
      where: { token, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count > 0;
  }

  upsertUserByEmail(email: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { email },
      create: { email, name: '' },
      update: {},
    });
  }

  createLoginPin(data: {
    email: string;
    pin: string;
    expiresAt: Date;
  }): Promise<LoginPin> {
    return this.prisma.loginPin.create({ data });
  }

  findLoginPin(data: {
    email: string;
    pin: string;
  }): Promise<LoginPin | null> {
    return this.prisma.loginPin.findFirst({
      where: {
        email: data.email,
        pin: data.pin,
        usedAt: null,
      },
    });
  }

  async consumeLoginPin(id: string): Promise<boolean> {
    const result = await this.prisma.loginPin.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count > 0;
  }

  async incrementLoginPinAttempts(id: string): Promise<number> {
    const updated = await this.prisma.loginPin.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
    return updated.attempts;
  }

  async invalidateLoginPin(id: string): Promise<void> {
    await this.prisma.loginPin.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
