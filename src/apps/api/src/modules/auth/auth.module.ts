import { Module } from '@nestjs/common'
import { EmailModule } from '@/modules/common/email/email.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
