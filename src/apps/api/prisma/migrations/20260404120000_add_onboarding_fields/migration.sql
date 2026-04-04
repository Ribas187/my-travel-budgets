-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dismissedTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);
