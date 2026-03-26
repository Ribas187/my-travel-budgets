import { randomBytes } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { IAuthRepository } from './repository/auth.repository.interface';

import type { JwtSessionPayload } from '@/modules/common/auth';
import { AUTH_REPOSITORY } from '@/modules/common/database';
import { EmailService } from '@/modules/common/email/email.service';
import { UnauthorizedError } from '@/modules/common/exceptions';

export type { JwtSessionPayload } from '@/modules/common/auth';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly email: EmailService,
    private readonly jwt: JwtService,
  ) {}

  async requestMagicLink(input: { email: string }): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.authRepository.createMagicLink({
      email: input.email,
      token,
      expiresAt,
    });

    try {
      await this.email.sendMagicLink(input.email, token);
    } catch (err) {
      this.logger.error('Failed to send magic link email', err);
    }
  }

  async verifyMagicLink(input: { token: string }): Promise<{ accessToken: string }> {
    const magicLink = await this.authRepository.findMagicLinkByToken(input.token);

    if (!magicLink) {
      this.logger.warn('Magic link not found');
      throw new UnauthorizedError('Invalid token');
    }

    if (magicLink.expiresAt < new Date()) {
      this.logger.warn('Magic link expired');
      throw new UnauthorizedError('Token expired');
    }

    if (magicLink.usedAt !== null) {
      this.logger.warn('Magic link already used');
      throw new UnauthorizedError('Token already used');
    }

    const consumed = await this.authRepository.consumeMagicLink(input.token);

    if (!consumed) {
      this.logger.warn('Magic link consumed by concurrent request');
      throw new UnauthorizedError('Token already used');
    }

    const user = await this.authRepository.upsertUserByEmail(magicLink.email);

    const payload: JwtSessionPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload);

    return { accessToken };
  }
}
