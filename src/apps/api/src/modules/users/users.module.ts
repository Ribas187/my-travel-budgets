import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaUserRepository } from './repository/user.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { USER_REPOSITORY } from '@/modules/common/database';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';

@Module({
  imports: [CommonAuthModule, CloudinaryModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
})
export class UsersModule {}
