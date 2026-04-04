import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

import type { IOnboardingRepository } from './onboarding.repository.interface';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class PrismaOnboardingRepository implements IOnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  setOnboardingCompleted(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });
  }

  clearOnboardingCompleted(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: null },
    });
  }

  async getDismissedTips(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { dismissedTips: true },
    });
    return user.dismissedTips;
  }

  addDismissedTip(userId: string, tipId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        dismissedTips: {
          push: tipId,
        },
      },
    });
  }

  clearDismissedTips(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { dismissedTips: [] },
    });
  }
}
