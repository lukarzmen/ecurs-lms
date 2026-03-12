-- Add VAT rate fields for platform fee configuration and teacher platform subscriptions
ALTER TABLE "platform_fee_configs"
ADD COLUMN "vatRate" DECIMAL(5, 2) NOT NULL DEFAULT 0.23;

ALTER TABLE "teacher_platform_subscriptions"
ADD COLUMN "vatRate" DECIMAL(5, 2) NOT NULL DEFAULT 0.23;

-- Normalize VAT to decimal fraction if any environment stored it as 23 instead of 0.23.
UPDATE "platform_fee_configs"
SET "vatRate" = "vatRate" / 100
WHERE "vatRate" > 1;

UPDATE "teacher_platform_subscriptions"
SET "vatRate" = "vatRate" / 100
WHERE "vatRate" > 1;

-- Keep platform fee config net in DB while preserving published gross prices.
UPDATE "platform_fee_configs"
SET "individualMonthlyFee" = 15.45
WHERE "individualMonthlyFee" = 19.00;

UPDATE "platform_fee_configs"
SET "schoolYearlyFee" = 974.80
WHERE "schoolYearlyFee" = 1199.00;
