import { Module } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [CommonAuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
