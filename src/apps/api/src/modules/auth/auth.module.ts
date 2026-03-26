import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaAuthRepository } from './repository/auth.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { AUTH_REPOSITORY } from '@/modules/common/database';
import { EmailModule } from '@/modules/common/email/email.module';

@Module({
  imports: [EmailModule, CommonAuthModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
  ],
})
export class AuthModule {}
