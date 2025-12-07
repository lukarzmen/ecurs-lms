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

    // Get user and their school
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: {
        id: true,
        roleId: true,
        ownedSchools: {
          select: {
            id: true,
            stripeAccountId: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only teachers (roleId === 1) can update their school's account
    if (user.roleId !== 1) {
      return NextResponse.json(
        { error: "Only teachers can update account type" },
        { status: 403 }
      );
    }

    if (!user.ownedSchools || user.ownedSchools.length === 0) {
      return NextResponse.json(
        { error: "No school found for this teacher" },
        { status: 404 }
      );
    }

    const school = user.ownedSchools[0];

    if (!school.stripeAccountId) {
      return NextResponse.json(
        { error: "School has no Stripe account" },
        { status: 404 }
      );
    }

    // Update Stripe account with account profile
    const updatedAccount = await stripe.accounts.update(
      school.stripeAccountId,
      {
        business_profile: {
          name: "School Account",
          url: process.env.NEXT_PUBLIC_APP_URL || "https://ecurs.pl",
        },
      } as any
    );

    return NextResponse.json({
      message: "Account type updated successfully",
      account: updatedAccount,
      schoolId: school.id,
    });
  } catch (error) {
    console.error("Error updating Stripe account type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
