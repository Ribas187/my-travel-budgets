import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { UserMeDto } from './dto/user-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { SetMainTravelDto } from './dto/set-main-travel.dto';

import { CurrentUser, JwtAuthGuard, type JwtAuthUser } from '@/modules/common/auth';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

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

  @Patch('me/main-travel')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async setMainTravel(
    @CurrentUser() user: JwtAuthUser,
    @Body() dto: SetMainTravelDto,
  ): Promise<UserMeDto> {
    return this.usersService.setMainTravel(user.userId, dto);
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: JwtAuthUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i, fallbackToMimetype: true })
        .addMaxSizeValidator({ maxSize: MAX_AVATAR_SIZE })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ): Promise<UserMeDto> {
    return this.usersService.uploadAvatar(user.userId, file);
  }

  @Delete('me/avatar')
  @HttpCode(HttpStatus.OK)
  async removeAvatar(@CurrentUser() user: JwtAuthUser): Promise<UserMeDto> {
    return this.usersService.removeAvatar(user.userId);
  }
}
