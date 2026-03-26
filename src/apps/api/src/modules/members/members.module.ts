import { Module } from '@nestjs/common';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PrismaMemberRepository } from './repository/member.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { MEMBER_REPOSITORY } from '@/modules/common/database';

@Module({
  imports: [CommonAuthModule],
  controllers: [MembersController],
  providers: [
    MembersService,
    { provide: MEMBER_REPOSITORY, useClass: PrismaMemberRepository },
  ],
})
export class MembersModule {}
