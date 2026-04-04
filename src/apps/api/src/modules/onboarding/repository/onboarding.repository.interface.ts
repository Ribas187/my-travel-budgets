import type { User } from '@prisma/client';

export interface IOnboardingRepository {
  setOnboardingCompleted(userId: string): Promise<User>;
  clearOnboardingCompleted(userId: string): Promise<User>;
  getDismissedTips(userId: string): Promise<string[]>;
  addDismissedTip(userId: string, tipId: string): Promise<User>;
  clearDismissedTips(userId: string): Promise<User>;
}
