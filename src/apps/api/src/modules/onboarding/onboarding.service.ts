import { Inject, Injectable, Logger } from '@nestjs/common';
import { ONBOARDING_TIP_IDS, type OnboardingTipId } from '@repo/core';

import type { IOnboardingRepository } from './repository/onboarding.repository.interface';

import { ONBOARDING_REPOSITORY } from '@/modules/common/database';
import { BusinessValidationError } from '@/modules/common/exceptions';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @Inject(ONBOARDING_REPOSITORY)
    private readonly onboardingRepository: IOnboardingRepository,
  ) {}

  async completeOnboarding(userId: string): Promise<void> {
    await this.onboardingRepository.setOnboardingCompleted(userId);
    this.logger.log(`Onboarding completed for user ${userId}`);
  }

  async dismissTip(userId: string, tipId: string): Promise<void> {
    if (!ONBOARDING_TIP_IDS.includes(tipId as OnboardingTipId)) {
      this.logger.warn(`Invalid tip ID attempted: ${tipId} by user ${userId}`);
      throw new BusinessValidationError(`Invalid tip ID: ${tipId}`);
    }

    // Fetch current user to check if tip is already dismissed (idempotent)
    const user = await this.onboardingRepository.getDismissedTips(userId);
    if (user.includes(tipId)) {
      return;
    }

    await this.onboardingRepository.addDismissedTip(userId, tipId);
    this.logger.log(`Tip ${tipId} dismissed for user ${userId}`);
  }

  async resetTips(userId: string): Promise<void> {
    await this.onboardingRepository.clearDismissedTips(userId);
    this.logger.log(`Tips reset for user ${userId}`);
  }
}
