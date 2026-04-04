import { Module } from '@nestjs/common';

import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PrismaOnboardingRepository } from './repository/onboarding.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { ONBOARDING_REPOSITORY } from '@/modules/common/database';

@Module({
  imports: [CommonAuthModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    { provide: ONBOARDING_REPOSITORY, useClass: PrismaOnboardingRepository },
  ],
})
export class OnboardingModule {}
