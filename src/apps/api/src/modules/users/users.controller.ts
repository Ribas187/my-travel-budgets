import { Body, Controller, Get, Patch, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';

import type { UsersService } from './users.service';
import type { UserMeDto } from './dto/user-me.dto';
import type { UpdateMeDto } from './dto/update-me.dto';

import { CurrentUser, JwtAuthGuard, type JwtAuthUser } from '@/modules/common/auth';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtAuthUser): Promise<UserMeDto> {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateMe(@CurrentUser() user: JwtAuthUser, @Body() dto: UpdateMeDto): Promise<UserMeDto> {
    return this.usersService.updateMe(user.userId, dto);
  }
}
