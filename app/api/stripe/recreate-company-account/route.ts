import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

function getAppOrigin(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL environment variable is required for Stripe Connect onboarding links"
    );
  }

  try {
    return new URL(baseUrl).origin;
  } catch {
    throw new Error(`Invalid URL format for NEXT_PUBLIC_APP_URL: ${baseUrl}`);
  }
}

export async function POST(req: Request) {
  try {
    const currentAuthUser = await currentUser();
    const email = currentAuthUser?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const confirm = body?.confirm === true;
    if (!confirm) {
      return NextResponse.json(
        { error: "Confirmation required", code: "CONFIRM_REQUIRED" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        roleId: true,
        ownedSchools: {
          select: {
            id: true,
            stripeAccountId: true,
            stripeOnboardingComplete: true,
            requiresVatInvoices: true,
            taxId: true,
            schoolType: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.roleId !== 1) {
      return NextResponse.json(
        { error: "Only teachers can perform this action" },
        { status: 403 }
      );
    }

    const school = user.ownedSchools?.[0];
    if (!school) {
      return NextResponse.json(
        { error: "Only school owners can perform this action" },
        { status: 403 }
      );
    }

    const hasNip = typeof school.taxId === "string" && school.taxId.trim().length > 0;
    if (!school.requiresVatInvoices || !hasNip) {
      return NextResponse.json(
        {
          error:
            "Aby utworzyć konto Stripe jako firma, ustaw 'Wymaga faktur VAT' i uzupełnij NIP w danych działalności.",
          code: "MISSING_VAT_OR_NIP",
        },
        { status: 400 }
      );
    }

    const previousAccountId = school.stripeAccountId ?? null;

    // Create a NEW Stripe Connect account as company.
    // This does not delete the old connected account; it switches the platform linkage for future payouts.
    const origin = getAppOrigin();

    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

    const accountData: any = {
      type: "express",
      country: "PL",
      email,
      business_type: "company",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: "daily",
          },
        },
      },
      business_profile: {
        mcc: "5815",
      },
    };

    if (!isLocalhost) {
      accountData.business_profile.url = origin;
    }

    const newAccount = await stripe.accounts.create(accountData);

    await db.school.update({
      where: { id: school.id },
      data: {
        stripeAccountId: newAccount.id,
        stripeOnboardingComplete: false,
        stripeAccountStatus: "pending",
        updatedAt: new Date(),
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: newAccount.id,
      refresh_url: `${origin}/teacher/settings?refresh=true`,
      return_url: `${origin}/teacher/settings?success=stripe`,
      type: "account_onboarding",
      collect: "eventually_due",
    });

    return NextResponse.json({
      onboardingUrl: accountLink.url,
      accountId: newAccount.id,
      previousAccountId,
      schoolId: school.id,
    });
  } catch (error) {
    console.error("[STRIPE_RECREATE_COMPANY_ACCOUNT]", error);

    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
