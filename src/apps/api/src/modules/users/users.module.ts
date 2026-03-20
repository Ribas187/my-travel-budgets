import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { CommonAuthModule } from '@/modules/common/auth';

@Module({
  imports: [CommonAuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
