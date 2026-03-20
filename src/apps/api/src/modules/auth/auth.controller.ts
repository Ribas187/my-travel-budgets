import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import type { AuthService } from './auth.service';
import type { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import type { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import type { VerifyMagicLinkQueryDto } from './dto/verify-magic-link-query.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async requestMagicLink(@Body() dto: RequestMagicLinkDto): Promise<{ message: string }> {
    await this.authService.requestMagicLink({ email: dto.email });
    return { message: 'If this email is registered, you will receive a magic link.' };
  }

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyMagicLink(@Query() query: VerifyMagicLinkQueryDto): Promise<AuthSessionResponseDto> {
    const { accessToken } = await this.authService.verifyMagicLink({ token: query.token });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 30 * 24 * 60 * 60,
    };
  }
}
