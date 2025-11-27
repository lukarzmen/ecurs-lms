import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

import { db } from "@/lib/db";

// Note: This API will work after running the Prisma migration to add platform subscription tables

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscriptionType } = body; // "individual" or "school"

        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: email },
            include: { 
                stripeCustomers: true,
                teacherPlatformSubscription: true 
            }
        });
        
        if (!user) {
            console.error("User not found for email:", email);
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is a teacher (roleId = 1)
        if (user.roleId !== 1) {
            return new NextResponse("Access denied. Only teachers can subscribe to platform.", { status: 403 });
        }

        // Check if user already has an active subscription
        if (user.teacherPlatformSubscription && 
            user.teacherPlatformSubscription.subscriptionStatus === 'active') {
            return new NextResponse("User already has an active platform subscription", { status: 400 });
        }

        // Get platform fee configuration
        const feeConfig = await db.platformFeeConfig.findFirst({
            where: { isActive: true }
        });
        
        if (!feeConfig) {
            return new NextResponse("Platform fee configuration not found", { status: 500 });
        }

        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2025-05-28.basil",
        });

        // Get or create Stripe customer
        let stripeCustomerId = user.stripeCustomers[0]?.stripeCustomerId || null;
        
        // Validate existing customer or create new one
        if (stripeCustomerId) {
            try {
                // Verify that the customer still exists in Stripe
                await stripeClient.customers.retrieve(stripeCustomerId);
            } catch (stripeError: any) {
                // Customer doesn't exist in Stripe anymore, remove from our database and create new one
                console.error(`Stripe customer ${stripeCustomerId} not found, removing from database:`, stripeError?.message);
                
                // Remove invalid customer record
                if (user.stripeCustomers[0]?.id) {
                    await db.stripeCustomer.delete({
                        where: { id: user.stripeCustomers[0].id }
                    });
                }
                stripeCustomerId = null;
            }
        }
        
        if (!stripeCustomerId) {
            const customer = await stripeClient.customers.create({
                email: email,
            });
            if (!customer) {
                return new NextResponse("Failed to create Stripe customer", { status: 500 });
            }
            stripeCustomerId = customer.id;
            await db.stripeCustomer.create({
                data: {
                    stripeCustomerId: stripeCustomerId,
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    userId: user.id,
                },
            });
        }

        // Calculate price based on subscription type
        const amount = subscriptionType === "individual" 
            ? Number(feeConfig.individualMonthlyFee) 
            : Number(feeConfig.schoolYearlyFee);
        
        const interval = subscriptionType === "individual" ? "month" : "year";
        const trialPeriodDays = feeConfig.trialPeriodDays;

        // Create or update teacher platform subscription record
        const teacherSubscription = await db.teacherPlatformSubscription.upsert({
            where: { userId: user.id },
            update: {
                subscriptionType,
                updatedAt: new Date(),
            },
            create: {
                userId: user.id,
                subscriptionType,
                subscriptionStatus: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Create Stripe checkout session
        const session = await stripeClient.checkout.sessions.create({
            mode: "subscription",
            customer: stripeCustomerId,
            line_items: [
                {
                    price_data: {
                        currency: feeConfig.currency.toLowerCase(),
                        product_data: {
                            name: `Ecurs Platform Access - ${subscriptionType === "individual" ? "Individual" : "School"}`,
                            description: `Access to Ecurs platform for ${subscriptionType === "individual" ? "individual teachers" : "schools"}`,
                        },
                        unit_amount: Math.round(amount * 100),
                        recurring: {
                            interval: interval as "month" | "year",
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_API_URL}/register?success=subscription`,
            cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/register?cancelled=subscription`,
            client_reference_id: String(teacherSubscription.id),
            metadata: {
                teacherSubscriptionId: teacherSubscription.id.toString(),
                userId: String(user.id),
                email: email,
                subscriptionType: subscriptionType,
                type: "platform_subscription",
            },
            subscription_data: {
                trial_period_days: trialPeriodDays,
                metadata: {
                    teacherSubscriptionId: teacherSubscription.id.toString(),
                    userId: user.id,
                    email: email,
                    subscriptionType: subscriptionType,
                    type: "platform_subscription",
                }
            },
        });

        return NextResponse.json({ 
            message: "Platform subscription checkout session created successfully", 
            sessionUrl: session.url 
        });

    } catch (error) {
        console.error("Platform subscription error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
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
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is a teacher (roleId = 1)
        if (user.roleId !== 1) {
            return new NextResponse("Access denied. Only teachers can access platform subscription info.", { status: 403 });
        }

        return NextResponse.json(user.teacherPlatformSubscription);

    } catch (error) {
        console.error("Get platform subscription error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}