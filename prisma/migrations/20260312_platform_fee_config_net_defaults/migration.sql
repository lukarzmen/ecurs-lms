-- Ensure platform_fee_configs keeps net prices in DB.
-- Previous schema defaults were gross (19 / 1199); API expects net.

ALTER TABLE "platform_fee_configs"
  ALTER COLUMN "individualMonthlyFee" SET DEFAULT 15.45,
  ALTER COLUMN "schoolYearlyFee" SET DEFAULT 974.80;

-- Migrate known legacy gross values to net.
UPDATE "platform_fee_configs"
SET "individualMonthlyFee" = 15.45,
   "schoolYearlyFee" = 974.80;
