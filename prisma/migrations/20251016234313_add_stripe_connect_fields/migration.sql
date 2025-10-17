-- AlterTable
ALTER TABLE "User" ADD "stripeAccountId" TEXT;
ALTER TABLE "User" ADD "stripeAccountStatus" TEXT DEFAULT 'pending';
ALTER TABLE "User" ADD "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;