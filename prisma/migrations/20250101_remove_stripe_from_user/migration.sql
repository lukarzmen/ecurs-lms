/*
  Warnings:

  - You are about to drop the column `stripeAccountId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeAccountStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeOnboardingComplete` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `requiresVatInvoices` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeAccountId",
DROP COLUMN IF EXISTS "stripeAccountStatus",
DROP COLUMN IF EXISTS "stripeOnboardingComplete",
DROP COLUMN IF EXISTS "businessType",
DROP COLUMN IF EXISTS "companyName",
DROP COLUMN IF EXISTS "requiresVatInvoices",
DROP COLUMN IF EXISTS "taxId";
