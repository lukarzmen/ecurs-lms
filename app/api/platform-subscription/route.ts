import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { Decimal } from "@prisma/client/runtime/library";

import { db } from "@/lib/db";

// Note: This API will work after running the Prisma migration to add platform subscription tables

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscriptionType, returnUrl } = body; // "individual" or "school", optional returnUrl

        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        
        console.log("Platform subscription POST - Email:", email, "SubscriptionType:", subscriptionType);
        
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: email },
            include: {
                stripeCustomers: true,
                teacherPlatformSubscription: true,
                ownedSchools: {
                    select: {
                        id: true,
                        taxId: true,
                    },
                    take: 1,
                },
                schoolMemberships: {
                    select: { schoolId: true },
                    take: 1,
                },
            }
        });
        
        console.log("User found:", user?.email, "RoleId:", user?.roleId, "Subscription status:", user?.teacherPlatformSubscription?.subscriptionStatus);
        
        if (!user) {
            console.error("User not found for email:", email);
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is a teacher (roleId = 1)
        if (user.roleId !== 1) {
            return new NextResponse("Access denied. Only teachers can subscribe to platform.", { status: 403 });
        }

        // Platform fees can be managed only by the school owner
        const isSchoolOwner = (user.ownedSchools?.length || 0) > 0;
        if (!isSchoolOwner) {
            return new NextResponse("Access denied. Only the school owner can manage platform fees.", { status: 403 });
        }

        // Check if user already has a subscription - return existing subscription data if so
        if (user.teacherPlatformSubscription) {
            console.log("User already has a subscription:", user.teacherPlatformSubscription);
            
            // If subscription is already active, don't create a new one
            if (user.teacherPlatformSubscription.subscriptionStatus === 'active') {
                return NextResponse.json(
                    { 
                        error: "User already has an active platform subscription",
                        existing: true,
                        subscription: user.teacherPlatformSubscription
                    },
                    { status: 400 }
                );
            }
            
            // If subscription is pending or trialing, allow to continue (will update via upsert)
            console.log("Existing subscription status:", user.teacherPlatformSubscription.subscriptionStatus, "- allowing to continue");
        }

        // Get platform fee configuration
        let feeConfig = await db.platformFeeConfig.findFirst({
            where: { isActive: true }
        });
        
        console.log("Platform fee config found:", !!feeConfig, "Config:", feeConfig);
        
        // If no config found in DB, use defaults
        if (!feeConfig) {
            console.log("No platform fee config found, using defaults");
            feeConfig = {
                id: 0,
                name: 'Default',
                description: 'Default configuration',
                individualMonthlyFee: new Decimal(15.45),
                schoolYearlyFee: new Decimal(974.80),
                vatRate: new Decimal(0.23),
                currency: 'PLN',
                trialPeriodDays: 90,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        
        // Ensure feeConfig is not null from this point on
        if (!feeConfig) {
            throw new Error("Could not initialize platform fee configuration");
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

        // Base fee is stored as net value; checkout is created with gross value.
        const amountNet = subscriptionType === "individual" 
            ? Number(feeConfig.individualMonthlyFee) 
            : Number(feeConfig.schoolYearlyFee);
        const rawVatRate = Number((feeConfig as any)?.vatRate ?? 0.23);
        // Backward compatibility for older rows where vatRate might be stored as 23.
        const vatRate = rawVatRate > 1 ? rawVatRate / 100 : rawVatRate;
        const amountGross = Number((amountNet * (1 + vatRate)).toFixed(2));
        
        const interval = subscriptionType === "individual" ? "month" : "year";
        const trialPeriodDays = feeConfig.trialPeriodDays;
        const ownerSchool = user.ownedSchools?.[0];
        const individualHasTaxId = Boolean(ownerSchool?.taxId?.trim());
        const shouldCollectTaxId =
            subscriptionType === "school" ||
            (subscriptionType === "individual" && individualHasTaxId);

        // Create or update teacher platform subscription record
        const teacherSubscription = await db.teacherPlatformSubscription.upsert({
            where: { userId: user.id },
            update: {
                subscriptionType,
                amount: new Decimal(amountNet),
                currency: feeConfig.currency.toUpperCase(),
                updatedAt: new Date(),
            } as any,
            create: {
                userId: user.id,
                subscriptionType,
                amount: new Decimal(amountNet),
                currency: feeConfig.currency.toUpperCase(),
                subscriptionStatus: "pending",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any,
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
                        unit_amount: Math.round(amountGross * 100),
                        recurring: {
                            interval: interval as "month" | "year",
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_API_URL}${returnUrl || '/register'}?success=subscription`,
            cancel_url: `${process.env.NEXT_PUBLIC_API_URL}${returnUrl || '/register'}?cancelled=subscription`,
            client_reference_id: String(teacherSubscription.id),
            // Zbieranie danych do faktury VAT (NIP, nazwa firmy, adres)
            // NIP jest zawsze opcjonalny ale dostępny dla wszystkich - zarówno szkół jak i JDG
            customer_update: {
                address: 'auto',
                name: 'auto',
            },
            billing_address_collection: 'required',
            ...(shouldCollectTaxId
                ? {
                    tax_id_collection: {
                        enabled: true,
                        required: 'if_supported',
                    },
                }
                : {}),
            metadata: {
                teacherSubscriptionId: teacherSubscription.id.toString(),
                userId: String(user.id),
                email: email,
                subscriptionType: subscriptionType,
                vatRate: String(vatRate),
                netAmount: amountNet.toFixed(2),
                grossAmount: amountGross.toFixed(2),
                type: "platform_subscription",
            },
            subscription_data: {
                trial_period_days: trialPeriodDays,
                metadata: {
                    teacherSubscriptionId: teacherSubscription.id.toString(),
                    userId: user.id,
                    email: email,
                    subscriptionType: subscriptionType,
                    vatRate: String(vatRate),
                    netAmount: amountNet.toFixed(2),
                    grossAmount: amountGross.toFixed(2),
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
        
        let errorMessage = "Internal server error";
        let errorDetails = {};
        
        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                name: error.name,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
        
        console.error("Error details:", { errorMessage, errorDetails });
        
        return NextResponse.json(
            { error: errorMessage, details: errorDetails },
            { status: 500 }
        );
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
                ownedSchools: {
                    select: { id: true },
                    take: 1,
                },
                schoolMemberships: {
                    select: {
                        school: {
                            select: { ownerId: true },
                        },
                    },
                    take: 1,
                },
            }
        });
        
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if user is a teacher (roleId = 1)
        if (user.roleId !== 1) {
            return new NextResponse("Access denied. Only teachers can access platform subscription info.", { status: 403 });
        }

        const isSchoolOwner = (user.ownedSchools?.length || 0) > 0;
        const ownerUserId = isSchoolOwner
            ? user.id
            : (user.schoolMemberships?.[0]?.school?.ownerId ?? user.id);

        const subscription = await db.teacherPlatformSubscription.findUnique({
            where: { userId: ownerUserId },
        });

        return NextResponse.json(subscription);

    } catch (error) {
        console.error("Get platform subscription error:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}