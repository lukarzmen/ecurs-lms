-- Remove requiresVatInvoices from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "requiresVatInvoices";

-- Add requiresVatInvoices to schools table
ALTER TABLE "schools" ADD COLUMN "requiresVatInvoices" BOOLEAN NOT NULL DEFAULT false;
