export class UserMeDto {
  id!: string;
  email!: string;
  name!: string;
  avatarUrl!: string | null;
  mainTravelId!: string | null;
  onboardingCompletedAt!: Date | null;
  dismissedTips!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}
