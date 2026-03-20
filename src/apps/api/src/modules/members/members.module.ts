import { Module } from '@nestjs/common';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';

import { CommonAuthModule } from '@/modules/common/auth';

@Module({
  imports: [CommonAuthModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
