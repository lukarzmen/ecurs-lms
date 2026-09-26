import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/commission";

const CONFIG_NAME = "Default Platform Fees";

export async function GET() {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const config = await db.platformFeeConfig.findFirst({ where: { isActive: true } });

    return NextResponse.json({
      commissionRatePercent: config ? Number(config.commissionRatePercent) : DEFAULT_COMMISSION_RATE_PERCENT,
      isActive: config?.isActive ?? true,
      updatedAt: config?.updatedAt ?? null,
    });
  } catch (error) {
    console.error("[ADMIN_COMMISSION_CONFIG_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const bodySchema = z.object({
  commissionRatePercent: z.number().min(0).max(99.99),
});

export async function PUT(req: Request) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const config = await db.platformFeeConfig.upsert({
      where: { name: CONFIG_NAME },
      update: { commissionRatePercent: parsed.data.commissionRatePercent, isActive: true },
      create: {
        name: CONFIG_NAME,
        description: "Default configuration for platform commission and legacy fees",
        commissionRatePercent: parsed.data.commissionRatePercent,
        isActive: true,
      },
    });

    return NextResponse.json({
      commissionRatePercent: Number(config.commissionRatePercent),
      isActive: config.isActive,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("[ADMIN_COMMISSION_CONFIG_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
