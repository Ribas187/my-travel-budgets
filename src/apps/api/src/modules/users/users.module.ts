import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';

@Module({
  imports: [CommonAuthModule, CloudinaryModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
