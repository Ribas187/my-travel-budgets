-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_memberId_fkey";

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "memberId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mainTravelId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mainTravelId_fkey" FOREIGN KEY ("mainTravelId") REFERENCES "Travel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TravelMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
