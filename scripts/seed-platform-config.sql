-- Seed script for platform fee configuration
-- Run this after the migration to add default platform fee configuration

INSERT INTO platform_fee_configs (
    name, 
    description, 
    "individualMonthlyFee", 
    "schoolYearlyFee", 
    "vatRate",
    currency, 
    "trialPeriodDays", 
    "isActive", 
    "createdAt", 
    "updatedAt"
) VALUES (
    'Default Platform Fees',
    'Default configuration for platform access fees for teachers',
    15.45,
    974.80,
    0.23,
    'PLN',
    90,
    true,
    NOW(),
    NOW()
) ON CONFLICT (name) DO UPDATE SET
    "individualMonthlyFee" = EXCLUDED."individualMonthlyFee",
    "schoolYearlyFee" = EXCLUDED."schoolYearlyFee",
    "vatRate" = EXCLUDED."vatRate",
    "trialPeriodDays" = EXCLUDED."trialPeriodDays",
    "updatedAt" = NOW();