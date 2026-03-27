import type { ConfigService } from '@nestjs/config';

import type { PrismaService } from '@/modules/prisma/prisma.service';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  describe('validate', () => {
    it('returns { userId, email } for valid payload', async () => {
      const config = {
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
      } as unknown as ConfigService;

      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'user-id-1', email: 'hello@test.com' }),
        },
      } as unknown as PrismaService;

      const strategy = new JwtStrategy(config, prisma);

      await expect(strategy.validate({ sub: 'user-id-1', email: 'hello@test.com' })).resolves.toEqual({
        userId: 'user-id-1',
        email: 'hello@test.com',
      });
    });
  });
});
