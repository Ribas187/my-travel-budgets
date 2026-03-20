import { Module } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { MembersController } from './members.controller'
import { MembersService } from './members.service'

@Module({
  imports: [CommonAuthModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
