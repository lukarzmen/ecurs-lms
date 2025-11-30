import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-05-28.basil" as any,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountType } = await req.json();

    // Get user
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: {
        id: true,
        stripeAccountId: true,
        businessType: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeAccountId) {
      return NextResponse.json(
        { error: "No Stripe account found" },
        { status: 404 }
      );
    }

    // Update Stripe account with new business type
    const updatedAccount = await stripe.accounts.update(
      user.stripeAccountId,
      {
        business_type:
          accountType === "school"
            ? ("individual" as const) // School is still individual but with different settings
            : "individual",
        business_profile: {
          name:
            accountType === "school"
              ? "School Account"
              : "Individual Teacher Account",
          url:
            accountType === "school"
              ? "https://ecurs.pl/school"
              : "https://ecurs.pl/teacher",
        },
      } as any
    );

    return NextResponse.json({
      message: "Account type updated successfully",
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating Stripe account type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
