import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaAuthRepository } from './repository/auth.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { AUTH_REPOSITORY } from '@/modules/common/database';
import { EmailModule } from '@/modules/common/email/email.module';

@Module({
  imports: [
    EmailModule,
    CommonAuthModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'auth', ttl: 900_000, limit: 10 }],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
  ],
})
export class AuthModule {}
