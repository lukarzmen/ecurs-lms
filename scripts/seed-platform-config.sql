-- Seed script for platform fee configuration
-- Run this after the migration to add default platform fee configuration

INSERT INTO platform_fee_configs (
    name, 
    description, 
    individual_monthly_fee, 
    school_yearly_fee, 
    currency, 
    trial_period_days, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'Default Platform Fees',
    'Default configuration for platform access fees for teachers',
    39.00,
    1499.00,
    'PLN',
    30,
    true,
    NOW(),
    NOW()
) ON CONFLICT (name) DO UPDATE SET
    individual_monthly_fee = EXCLUDED.individual_monthly_fee,
    school_yearly_fee = EXCLUDED.school_yearly_fee,
    trial_period_days = EXCLUDED.trial_period_days,
    updated_at = NOW();