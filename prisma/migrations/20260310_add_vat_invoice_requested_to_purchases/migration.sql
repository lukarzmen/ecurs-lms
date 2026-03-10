-- AlterTable
ALTER TABLE "UserCoursePurchase"
ADD COLUMN "vatInvoiceRequested" BOOLEAN;

-- AlterTable
ALTER TABLE "EducationalPathPurchase"
ADD COLUMN "vatInvoiceRequested" BOOLEAN;

-- Backfill from metadata where possible
UPDATE "UserCoursePurchase"
SET "vatInvoiceRequested" = CASE
    WHEN lower(coalesce("metadata"->>'vatInvoiceRequested', '')) IN ('true', '1', 'yes', 'on') THEN true
    WHEN lower(coalesce("metadata"->>'vatInvoiceRequested', '')) IN ('false', '0', 'no', 'off') THEN false
    ELSE NULL
END
WHERE "vatInvoiceRequested" IS NULL
  AND "metadata" IS NOT NULL
  AND "metadata" ? 'vatInvoiceRequested';

UPDATE "EducationalPathPurchase"
SET "vatInvoiceRequested" = CASE
    WHEN lower(coalesce("metadata"->>'vatInvoiceRequested', '')) IN ('true', '1', 'yes', 'on') THEN true
    WHEN lower(coalesce("metadata"->>'vatInvoiceRequested', '')) IN ('false', '0', 'no', 'off') THEN false
    ELSE NULL
END
WHERE "vatInvoiceRequested" IS NULL
  AND "metadata" IS NOT NULL
  AND "metadata" ? 'vatInvoiceRequested';
