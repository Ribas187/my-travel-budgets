import { randomBytes, randomInt } from 'node:crypto';

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

  async requestLoginPin(input: { email: string }): Promise<void> {
    const pin = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.authRepository.createLoginPin({
      email: input.email,
      pin,
      expiresAt,
    });

    try {
      await this.email.sendLoginPin(input.email, pin);
    } catch (err) {
      this.logger.error('Failed to send login PIN email', err);
    }
  }

  async verifyLoginPin(input: { email: string; pin: string }): Promise<{ accessToken: string }> {
    const loginPin = await this.authRepository.findLoginPin({
      email: input.email,
      pin: input.pin,
    });

    if (!loginPin) {
      await this.handleFailedPinAttempt(input.email);
      throw new UnauthorizedError('Invalid code');
    }

    if (loginPin.expiresAt < new Date()) {
      this.logger.warn('Login PIN expired');
      throw new UnauthorizedError('Code expired');
    }

    if (loginPin.attempts >= 5) {
      this.logger.warn('Login PIN max attempts reached');
      throw new UnauthorizedError('Too many attempts');
    }

    const consumed = await this.authRepository.consumeLoginPin(loginPin.id);

    if (!consumed) {
      this.logger.warn('Login PIN consumed by concurrent request');
      throw new UnauthorizedError('Invalid code');
    }

    const user = await this.authRepository.upsertUserByEmail(loginPin.email);

    const payload: JwtSessionPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload);

    return { accessToken };
  }

  private async handleFailedPinAttempt(email: string): Promise<void> {
    const latestPin = await this.authRepository.findLatestUnusedLoginPin(email);

    if (!latestPin) {
      return;
    }

    const attempts = await this.authRepository.incrementLoginPinAttempts(latestPin.id);

    if (attempts >= 5) {
      this.logger.warn('Login PIN invalidated after too many attempts');
      await this.authRepository.invalidateLoginPin(latestPin.id);
    }
  }
}
