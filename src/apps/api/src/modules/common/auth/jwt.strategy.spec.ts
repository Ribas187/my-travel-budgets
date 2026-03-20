import type { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  describe('validate', () => {
    it('returns { userId, email } for valid payload', () => {
      const config = {
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
      } as unknown as ConfigService;

      const strategy = new JwtStrategy(config);

      expect(strategy.validate({ sub: 'user-id-1', email: 'hello@test.com' })).toEqual({
        userId: 'user-id-1',
        email: 'hello@test.com',
      });
    });
  });
});
