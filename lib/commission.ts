import { db } from "@/lib/db";

// Ecurs platform commission (replaces the old flat teacher subscription model).
// The platform takes a percentage cut of each course/educational path sale via
// Stripe Connect `application_fee_amount` / `application_fee_percent` on direct charges.
// No fee is charged unless a sale actually happens - there is no cost to register or list free content.
//
// The rate is admin-configurable at runtime via `PlatformFeeConfig.commissionRatePercent`
// (active row) - see app/api/admin/commission-config/route.ts. Falls back to the
// PLATFORM_COMMISSION_RATE_PERCENT env var, then to DEFAULT_COMMISSION_RATE_PERCENT.
export const DEFAULT_COMMISSION_RATE_PERCENT = 8;

function getEnvFallbackRatePercent(): number {
  const envRate = Number(process.env.PLATFORM_COMMISSION_RATE_PERCENT);
  return Number.isFinite(envRate) && envRate >= 0 && envRate < 100 ? envRate : DEFAULT_COMMISSION_RATE_PERCENT;
}

/** Reads the admin-configured commission rate (%) from the active PlatformFeeConfig row, with env/default fallback. */
export async function getCommissionRatePercent(): Promise<number> {
  try {
    const config = await db.platformFeeConfig.findFirst({
      where: { isActive: true },
      select: { commissionRatePercent: true },
    });
    const rate = config?.commissionRatePercent != null ? Number(config.commissionRatePercent) : null;
    if (rate != null && Number.isFinite(rate) && rate >= 0 && rate < 100) {
      return rate;
    }
  } catch (error) {
    console.error("[getCommissionRatePercent] Falling back to env/default rate:", error);
  }
  return getEnvFallbackRatePercent();
}

/** Application fee in the smallest currency unit (grosz), for one-time payment Stripe Checkout sessions. */
export function calculateApplicationFeeAmount(grossAmountInSmallestUnit: number, commissionRatePercent: number): number {
  return Math.round(grossAmountInSmallestUnit * (commissionRatePercent / 100));
}

