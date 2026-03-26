import type { MagicLink, User } from '@prisma/client';

export interface IAuthRepository {
  createMagicLink(data: {
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<MagicLink>;
  findMagicLinkByToken(token: string): Promise<MagicLink | null>;
  consumeMagicLink(token: string): Promise<boolean>;
  upsertUserByEmail(email: string): Promise<User>;
}
