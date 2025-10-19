import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

import { db } from "@/lib/db";

// Note: This API will work after running the Prisma migration to add platform subscription tables

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscriptionId } = body;

        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: email },
            include: { 
                teacherPlatformSubscription: true 
            }
        });
        
        if (!user) {
            console.error("User not found for email:", email);
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is a teacher (roleId = 1)
        if (user.roleId !== 1) {
            return new NextResponse("Access denied. Only teachers can cancel platform subscription.", { status: 403 });
        }

        if (!user.teacherPlatformSubscription) {
            return new NextResponse("No platform subscription found for this user", { status: 404 });
        }

        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2025-05-28.basil",
        });

        // Cancel the subscription at period end in Stripe
        if (subscriptionId || user.teacherPlatformSubscription.subscriptionId) {
            const stripeSubscriptionId = subscriptionId || user.teacherPlatformSubscription.subscriptionId;
            
            await stripeClient.subscriptions.update(stripeSubscriptionId, {
                cancel_at_period_end: true,
            });
        }

        // Update the subscription status in our database
        await db.teacherPlatformSubscription.update({
            where: { userId: user.id },
            data: {
                subscriptionStatus: "cancel_at_period_end",
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ 
            message: "Platform subscription will be cancelled at the end of the current billing period" 
        });

    } catch (error) {
        console.error("Cancel platform subscription error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}