import type { LoginPin, MagicLink, User } from '@prisma/client';

export interface IAuthRepository {
  createMagicLink(data: {
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<MagicLink>;
  findMagicLinkByToken(token: string): Promise<MagicLink | null>;
  consumeMagicLink(token: string): Promise<boolean>;
  upsertUserByEmail(email: string): Promise<User>;

  createLoginPin(data: {
    email: string;
    pin: string;
    expiresAt: Date;
  }): Promise<LoginPin>;
  findLoginPin(data: { email: string; pin: string }): Promise<LoginPin | null>;
  findLatestUnusedLoginPin(email: string): Promise<LoginPin | null>;
  consumeLoginPin(id: string): Promise<boolean>;
  incrementLoginPinAttempts(id: string): Promise<number>;
  invalidateLoginPin(id: string): Promise<void>;
}
