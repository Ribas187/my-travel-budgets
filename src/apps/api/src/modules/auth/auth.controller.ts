import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { RequestLoginPinDto } from './dto/request-login-pin.dto';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { VerifyLoginPinDto } from './dto/verify-login-pin.dto';
import { VerifyMagicLinkQueryDto } from './dto/verify-magic-link-query.dto';
import { PinThrottleGuard } from './guards/pin-throttle.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SkipThrottle()
  async requestMagicLink(@Body() dto: RequestMagicLinkDto): Promise<{ message: string }> {
    await this.authService.requestMagicLink({ email: dto.email });
    return { message: 'If this email is registered, you will receive a magic link.' };
  }

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SkipThrottle()
  async verifyMagicLink(@Query() query: VerifyMagicLinkQueryDto): Promise<AuthSessionResponseDto> {
    const { accessToken } = await this.authService.verifyMagicLink({ token: query.token });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 30 * 24 * 60 * 60,
    };
  }

  @Post('login-pin')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Throttle({ auth: { limit: 5, ttl: 900_000 } })
  @UseGuards(PinThrottleGuard)
  async requestLoginPin(@Body() dto: RequestLoginPinDto): Promise<{ message: string }> {
    await this.authService.requestLoginPin({ email: dto.email });
    return { message: 'If this email is registered, you will receive a login code.' };
  }

  @Post('verify-pin')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @UseGuards(PinThrottleGuard)
  async verifyLoginPin(@Body() dto: VerifyLoginPinDto): Promise<AuthSessionResponseDto> {
    const { accessToken } = await this.authService.verifyLoginPin({
      email: dto.email,
      pin: dto.pin,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 30 * 24 * 60 * 60,
    };
  }
}
