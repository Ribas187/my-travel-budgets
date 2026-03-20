import { randomBytes } from 'node:crypto';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';

import type { JwtSessionPayload } from '@/modules/common/auth';
import type { EmailService } from '@/modules/common/email/email.service';
import type { PrismaService } from '@/modules/prisma/prisma.service';

export type { JwtSessionPayload } from '@/modules/common/auth';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly jwt: JwtService,
  ) {}

  async requestMagicLink(input: { email: string }): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.magicLink.create({
      data: { email: input.email, token, expiresAt },
    });

    try {
      await this.email.sendMagicLink(input.email, token);
    } catch (err) {
      this.logger.error('Failed to send magic link email', err);
    }
  }

  async verifyMagicLink(input: { token: string }): Promise<{ accessToken: string }> {
    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token: input.token },
    });

    if (!magicLink) {
      this.logger.warn('Magic link not found');
      throw new UnauthorizedException('Invalid token');
    }

    if (magicLink.expiresAt < new Date()) {
      this.logger.warn('Magic link expired');
      throw new UnauthorizedException('Token expired');
    }

    if (magicLink.usedAt !== null) {
      this.logger.warn('Magic link already used');
      throw new UnauthorizedException('Token already used');
    }

    const result = await this.prisma.magicLink.updateMany({
      where: { token: input.token, usedAt: null },
      data: { usedAt: new Date() },
    });

    if (result.count === 0) {
      this.logger.warn('Magic link consumed by concurrent request');
      throw new UnauthorizedException('Token already used');
    }

    const user = await this.prisma.user.upsert({
      where: { email: magicLink.email },
      create: { email: magicLink.email, name: '' },
      update: {},
    });

    const payload: JwtSessionPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload);

    return { accessToken };
  }
}
