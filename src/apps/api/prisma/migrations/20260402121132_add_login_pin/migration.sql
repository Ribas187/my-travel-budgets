-- CreateTable
CREATE TABLE "LoginPin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginPin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginPin_email_pin_usedAt_expiresAt_idx" ON "LoginPin"("email", "pin", "usedAt", "expiresAt");
