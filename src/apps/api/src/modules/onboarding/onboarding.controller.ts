import { Controller, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';

import { OnboardingService } from './onboarding.service';

import { CurrentUser, JwtAuthGuard, type JwtAuthUser } from '@/modules/common/auth';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch('complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async complete(@CurrentUser() user: JwtAuthUser): Promise<void> {
    await this.onboardingService.completeOnboarding(user.userId);
  }

  @Patch('tips/:tipId/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismissTip(
    @CurrentUser() user: JwtAuthUser,
    @Param('tipId') tipId: string,
  ): Promise<void> {
    await this.onboardingService.dismissTip(user.userId, tipId);
  }

  @Patch('tips/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetTips(@CurrentUser() user: JwtAuthUser): Promise<void> {
    await this.onboardingService.resetTips(user.userId);
  }
}
