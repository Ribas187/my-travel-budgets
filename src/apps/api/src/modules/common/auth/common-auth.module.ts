import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { PassportModule } from '@nestjs/passport';

import { JwtAuthGuard } from './jwt-auth.guard';
import { PolicyGuard } from './policy.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '30d') as StringValue,
        },
      }),
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, PolicyGuard],
  exports: [PassportModule, JwtModule, JwtStrategy, JwtAuthGuard, PolicyGuard],
})
export class CommonAuthModule {}
