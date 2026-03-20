import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { EmailModule } from '@/modules/common/email/email.module';

@Module({
  imports: [EmailModule, CommonAuthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
