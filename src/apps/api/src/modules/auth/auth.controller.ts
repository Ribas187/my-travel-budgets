import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RequestMagicLinkDto } from './dto/request-magic-link.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async requestMagicLink(
    @Body() dto: RequestMagicLinkDto,
  ): Promise<{ message: string }> {
    await this.authService.requestMagicLink({ email: dto.email })
    return { message: 'If this email is registered, you will receive a magic link.' }
  }
}
