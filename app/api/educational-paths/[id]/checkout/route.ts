import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { use } from "react";
import Stripe from "stripe";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const awaitedParams = await params;
        const educationalPathId = awaitedParams.id;
        if (!educationalPathId) {
            return new NextResponse("Educational Path Id is required", { status: 400 });
        }

        const body = await req.json();
        const promoCode = body.promoCode || "";
        const vatInvoiceRequested = body.vatInvoiceRequested || false; // Czy klient chce fakturę VAT
        const paymentType = "educationalPath";

        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: email },
            include: { stripeCustomers: true }
        });
        if (!user) {
            console.error("User not found for email:", email);
            return new NextResponse("User not found", { status: 404 });
        }

        // Find or create user-educational-path join
        let userEducationalPath = await db.userEducationalPath.findUnique({
            where: {
                userId_educationalPathId: {
                    userId: user.id,
                    educationalPathId: Number(educationalPathId),
                }
            }
        });

        if (!userEducationalPath) {
            // Create userEducationalPath with state 0 (unpaid) - will be updated to 1 by webhook upon successful payment
            userEducationalPath = await db.userEducationalPath.create({
                data: {
                    userId: user.id,
                    educationalPathId: Number(educationalPathId),
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    state: 0, // 0 = unpaid, 1 = paid/enrolled
                }
            });
        }

        // Get all courses in the educational path
        const eduPath = await db.educationalPath.findUnique({
            where: { id: Number(educationalPathId) },
            select: {
                title: true,
                imageId: true,
                author: {
                    select: {
                        stripeAccountId: true,
                        stripeOnboardingComplete: true
                    }
                },
                courses: {
                    select: {
                        courseId: true
                    }
                }
            }
        });
        if (!eduPath) {
            console.error("Educational Path not found for id:", educationalPathId);
            return new NextResponse("Educational Path not found", { status: 404 });
        }

        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2025-05-28.basil",
        });

        console.log(`Educational path ${educationalPathId} author Stripe setup:`, {
            stripeAccountId: eduPath.author?.stripeAccountId,
            stripeOnboardingComplete: eduPath.author?.stripeOnboardingComplete
        });

        // Check if teacher has completed Stripe onboarding
        if (!eduPath.author?.stripeAccountId || !eduPath.author?.stripeOnboardingComplete) {
            console.error(`Teacher payment account not configured for educational path ${educationalPathId}. StripeAccountId: ${eduPath.author?.stripeAccountId}, OnboardingComplete: ${eduPath.author?.stripeOnboardingComplete}`);
            return new NextResponse(JSON.stringify({ 
                error: "Autor ścieżki edukacyjnej nie ma skonfigurowanego konta płatności. Skontaktuj się z autorem, aby zakończył konfigurację płatności.",
                details: "Teacher Stripe account not configured"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify that the Stripe account is still active
        try {
            console.log(`Verifying Stripe account: ${eduPath.author.stripeAccountId}`);
            const teacherAccount = await stripeClient.accounts.retrieve(eduPath.author.stripeAccountId);
            if (!teacherAccount.charges_enabled || !teacherAccount.payouts_enabled) {
                console.error(`Teacher Stripe account ${eduPath.author.stripeAccountId} is not fully enabled. Charges: ${teacherAccount.charges_enabled}, Payouts: ${teacherAccount.payouts_enabled}`);
                return new NextResponse(JSON.stringify({ 
                    error: "Konto płatności autora ścieżki edukacyjnej nie jest aktywne. Płatność została anulowana.",
                    details: "Teacher Stripe account not fully enabled"
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            console.log(`Teacher Stripe account ${eduPath.author.stripeAccountId} is active and enabled`);
        } catch (stripeError) {
            console.error(`Failed to verify teacher Stripe account ${eduPath.author.stripeAccountId}:`, stripeError);
            return new NextResponse(JSON.stringify({ 
                error: "Nie można zweryfikować konta płatności autora. Skontaktuj się z autorem ścieżki edukacyjnej.",
                details: "Cannot verify teacher Stripe account"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        // Fetch price from EducationalPathPrice
        const price = await db.educationalPathPrice.findUnique({
            where: { educationalPathId: Number(educationalPathId) },
        });

        // Create or update UserCourse for all courses in the path with state 0 initially
        // These will be updated to state 1 by webhook upon successful payment
        if (eduPath.courses && eduPath.courses.length > 0) {
            for (const course of eduPath.courses) {
                const userCourse = await db.userCourse.findUnique({
                    where: {
                        userId_courseId: {
                            userId: user.id,
                            courseId: course.courseId,
                        }
                    }
                });
                if (!userCourse) {
                    await db.userCourse.create({
                        data: {
                            userId: user.id,
                            updatedAt: new Date(),
                            createdAt: new Date(),
                            courseId: course.courseId,
                            state: 0, // 0 = unpaid, will be set to 1 by webhook upon successful payment
                        }
                    });
                } else if (userCourse.state !== 0) {
                    // Reset to unpaid state since this is a new payment attempt
                    await db.userCourse.update({
                        where: {
                            userId_courseId: {
                                userId: user.id,
                                courseId: course.courseId,
                            }
                        },
                        data: {
                            state: 0,
                            updatedAt: new Date(),
                        }
                    });
                }
            }
        }

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
                return new NextResponse("Failed to create customer", { status: 500 });
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

        // Calculate price with promo code using new pricing structure
        let finalPrice = Number(price?.amount ?? 0);
        let discount = 0;
        const currency = price?.currency || "pln";
        const isRecurring = price?.isRecurring;
        const interval = price?.interval;
        const vatRate = Number(price?.vatRate ?? 23);
        if (promoCode) {
            // Find all promo code joins for this educational path
            const joins = await db.educationalPathPromoCode.findMany({
                where: { educationalPathId: Number(educationalPathId) },
            });
            if (joins.length) {
                // Find promoCode with matching code and id in join table
                const promo = await db.promoCode.findFirst({
                    where: {
                        code: promoCode,
                        id: { in: joins.map(j => j.promoCodeId) },
                    },
                    select: { discount: true }
                });
                if (promo && typeof promo.discount === "number" && promo.discount > 0) {
                    discount = promo.discount;
                    finalPrice = finalPrice * (1 - discount / 100);
                }
            }
        }
        
        // Apply VAT to final price
        const priceWithoutVat = finalPrice;
        const vatAmount = (priceWithoutVat * vatRate) / 100;
        finalPrice = priceWithoutVat + vatAmount;

        let session;
        // Only allow 'month' or 'year' for Stripe recurring interval
        let stripeRecurringInterval: "month" | "year" | undefined = undefined;
        if (isRecurring && interval && interval !== "ONE_TIME") {
            if (interval === "MONTH") {
                stripeRecurringInterval = "month";
            } else if (interval === "YEAR") {
                stripeRecurringInterval = "year";
            }
        }
        if (isRecurring && stripeRecurringInterval) {
            // Use trialPeriodType to determine which trial field to use
            let trialPeriodDays = 0;
            if (price?.trialPeriodType === "DATE" && price?.trialPeriodEnd) {
                const endDate = new Date(price.trialPeriodEnd);
                const now = new Date();
                const diffMs = endDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                trialPeriodDays = diffDays > 0 ? diffDays : 0;
            } else if (price?.trialPeriodType === "DAYS" && typeof price?.trialPeriodDays === "number" && price.trialPeriodDays > 0) {
                trialPeriodDays = price.trialPeriodDays;
            }
            
            console.log(`Trial period calculation:`, {
                trialPeriodType: price?.trialPeriodType,
                trialPeriodDays: price?.trialPeriodDays,
                trialPeriodEnd: price?.trialPeriodEnd,
                calculatedTrialDays: trialPeriodDays
            });
            
            // Final validation before creating session
            if (!stripeCustomerId) {
                console.error("stripeCustomerId is null before creating subscription checkout session");
                return new NextResponse("Customer ID is required for checkout", { status: 500 });
            }
            
            console.log(`Creating subscription checkout session on Connect account: ${eduPath.author.stripeAccountId}`);
            console.log(`Using customer: ${stripeCustomerId}`);
            
            // Create customer on Connect account if needed
            try {
                await stripeClient.customers.retrieve(stripeCustomerId, {
                    stripeAccount: eduPath.author.stripeAccountId
                });
                console.log(`Customer exists on Connect account: ${stripeCustomerId}`);
            } catch (connectError: any) {
                console.log(`Customer doesn't exist on Connect account, creating new one...`);
                // Customer doesn't exist on Connect account, create it
                const connectCustomer = await stripeClient.customers.create({
                    email: email,
                }, {
                    stripeAccount: eduPath.author.stripeAccountId
                });
                stripeCustomerId = connectCustomer.id;
                console.log(`Created customer on Connect account: ${stripeCustomerId}`);
                
                // Update or create our database record with the Connect account customer ID
                await db.stripeCustomer.upsert({
                    where: { userId: user.id },
                    update: {
                        stripeCustomerId: stripeCustomerId,
                        updatedAt: new Date()
                    },
                    create: {
                        stripeCustomerId: stripeCustomerId,
                        updatedAt: new Date(),
                        createdAt: new Date(),
                        userId: user.id,
                    },
                });
                console.log(`Upserted StripeCustomer record for user ${user.id} with customer ${stripeCustomerId}`);
            }
            
            // Create or retrieve tax rate for the Connect account
            let taxRates: string[] = [];
            if (vatRate > 0) {
                try {
                    // Try to find existing tax rate
                    const existingRates = await stripeClient.taxRates.list({
                        active: true,
                    }, {
                        stripeAccount: eduPath.author.stripeAccountId
                    });
                    
                    const matchingRate = existingRates.data.find(rate => 
                        rate.percentage === vatRate && 
                        rate.inclusive === false
                    );
                    
                    if (matchingRate) {
                        taxRates = [matchingRate.id];
                        console.log(`Using existing tax rate: ${matchingRate.id} (${vatRate}%)`);
                    } else {
                        // Create new tax rate
                        const newTaxRate = await stripeClient.taxRates.create({
                            display_name: `VAT ${vatRate}%`,
                            percentage: vatRate,
                            inclusive: false,
                            description: `VAT ${vatRate}%`,
                        }, {
                            stripeAccount: eduPath.author.stripeAccountId
                        });
                        taxRates = [newTaxRate.id];
                        console.log(`Created new tax rate: ${newTaxRate.id} (${vatRate}%)`);
                    }
                } catch (taxError) {
                    console.error(`Failed to create/retrieve tax rate:`, taxError);
                    // Continue without tax rate - will show 0% VAT
                }
            }
            
            session = await stripeClient.checkout.sessions.create({
                mode: "subscription",
                customer: stripeCustomerId,
                line_items: [
                    {
                        price_data: {
                            currency: currency.toLowerCase(),
                            product_data: {
                                name: eduPath.title,
                                description: "Ścieżka edukacyjna",
                                images: eduPath.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${eduPath.imageId}`] : [],
                            },
                            unit_amount: Math.round(priceWithoutVat * 100), // Price WITHOUT VAT
                            recurring: {
                                interval: stripeRecurringInterval,
                            },
                            tax_behavior: 'exclusive', // VAT will be added on top
                        },
                        quantity: 1,
                        tax_rates: taxRates, // Apply tax rate
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?success=1`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?canceled=1`,
                client_reference_id: String(userEducationalPath.id),
                // NOTE: invoice_creation is not supported in subscription mode - Stripe creates invoices automatically
                metadata: {
                    userEducationalPathId: userEducationalPath.id.toString(),
                    educationalPathId: educationalPathId,
                    userId: String(user.id),
                    email: email,
                    promoCode: promoCode,
                    discount: discount.toString(),
                    mode: "subscription",
                    type: paymentType,
                    teacherAccountId: eduPath.author.stripeAccountId,
                    vatInvoiceRequested: vatInvoiceRequested.toString(),
                },
                subscription_data: {
                    // Only include trial_period_days if it's greater than 0 (Stripe requirement)
                    ...(trialPeriodDays > 0 ? { trial_period_days: trialPeriodDays } : {}),
                    // NIE używamy transfer_data gdy operujemy bezpośrednio na Connect account
                    // Pieniądze automatycznie zostają na koncie nauczyciela
                    metadata: {
                        userEducationalPathId: userEducationalPath.id.toString(),
                        educationalPathId: educationalPathId,
                        userId: user.id,
                        email: email,
                        promoCode: promoCode,
                        discount: discount.toString(),
                        mode: "subscription",
                        type: paymentType,
                        teacherAccountId: eduPath.author.stripeAccountId,
                        vatInvoiceRequested: vatInvoiceRequested.toString(),
                    }
                },
            }, {
                // Wykonanie na koncie nauczyciela (Connect Account)
                stripeAccount: eduPath.author.stripeAccountId,
            });
        } else {
            // One-time payment
            
            // Final validation before creating session
            if (!stripeCustomerId) {
                console.error("stripeCustomerId is null before creating one-time checkout session");
                return new NextResponse("Customer ID is required for checkout", { status: 500 });
            }
            
            console.log(`Creating one-time payment checkout session on Connect account: ${eduPath.author.stripeAccountId}`);
            console.log(`Using customer: ${stripeCustomerId}`);
            
            // Create customer on Connect account if needed
            try {
                await stripeClient.customers.retrieve(stripeCustomerId, {
                    stripeAccount: eduPath.author.stripeAccountId
                });
                console.log(`Customer exists on Connect account: ${stripeCustomerId}`);
            } catch (connectError: any) {
                console.log(`Customer doesn't exist on Connect account, creating new one...`);
                // Customer doesn't exist on Connect account, create it
                const connectCustomer = await stripeClient.customers.create({
                    email: email,
                }, {
                    stripeAccount: eduPath.author.stripeAccountId
                });
                stripeCustomerId = connectCustomer.id;
                console.log(`Created customer on Connect account: ${stripeCustomerId}`);
                
                // Update or create our database record with the Connect account customer ID
                await db.stripeCustomer.upsert({
                    where: { userId: user.id },
                    update: {
                        stripeCustomerId: stripeCustomerId,
                        updatedAt: new Date()
                    },
                    create: {
                        stripeCustomerId: stripeCustomerId,
                        updatedAt: new Date(),
                        createdAt: new Date(),
                        userId: user.id,
                    },
                });
                console.log(`Upserted StripeCustomer record for user ${user.id} with customer ${stripeCustomerId}`);
            }
            
            // Create or retrieve tax rate for the Connect account
            let taxRates: string[] = [];
            if (vatRate > 0) {
                try {
                    // Try to find existing tax rate
                    const existingRates = await stripeClient.taxRates.list({
                        active: true,
                    }, {
                        stripeAccount: eduPath.author.stripeAccountId
                    });
                    
                    const matchingRate = existingRates.data.find(rate => 
                        rate.percentage === vatRate && 
                        rate.inclusive === false
                    );
                    
                    if (matchingRate) {
                        taxRates = [matchingRate.id];
                        console.log(`Using existing tax rate: ${matchingRate.id} (${vatRate}%)`);
                    } else {
                        // Create new tax rate
                        const newTaxRate = await stripeClient.taxRates.create({
                            display_name: `VAT ${vatRate}%`,
                            percentage: vatRate,
                            inclusive: false,
                            description: `VAT ${vatRate}%`,
                        }, {
                            stripeAccount: eduPath.author.stripeAccountId
                        });
                        taxRates = [newTaxRate.id];
                        console.log(`Created new tax rate: ${newTaxRate.id} (${vatRate}%)`);
                    }
                } catch (taxError) {
                    console.error(`Failed to create/retrieve tax rate:`, taxError);
                    // Continue without tax rate - will show 0% VAT
                }
            }
            
            session = await stripeClient.checkout.sessions.create({
                mode: "payment",
                customer: stripeCustomerId,
                line_items: [
                    {
                        price_data: {
                            currency: currency.toLowerCase(),
                            product_data: {
                                name: eduPath.title,
                                description: "Ścieżka edukacyjna",
                                images: eduPath.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${eduPath.imageId}`] : [],
                            },
                            unit_amount: Math.round(priceWithoutVat * 100), // Price WITHOUT VAT
                            tax_behavior: 'exclusive', // VAT will be added on top
                        },
                        quantity: 1,
                        tax_rates: taxRates, // Apply tax rate
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?success=1`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?canceled=1`,
                client_reference_id: String(userEducationalPath.id),
                // Automatyczne faktury jeśli żądane
                invoice_creation: vatInvoiceRequested ? { 
                    enabled: true,
                    invoice_data: {
                        description: `Ścieżka edukacyjna: ${eduPath.title}`,
                        custom_fields: [
                            {
                                name: 'Typ produktu',
                                value: 'Ścieżka edukacyjna - usługa cyfrowa'
                            }
                        ]
                    }
                } : undefined,
                metadata: {
                    userEducationalPathId: userEducationalPath.id.toString(),
                    educationalPathId: educationalPathId,
                    userId: String(user.id),
                    email: email,
                    promoCode: promoCode,
                    discount: discount.toString(),
                    mode: "payment",
                    type: paymentType,
                    teacherAccountId: eduPath.author.stripeAccountId,
                    vatInvoiceRequested: vatInvoiceRequested.toString(),
                },
                // NIE używamy payment_intent_data.transfer_data gdy operujemy bezpośrednio na Connect account
                // Pieniądze automatycznie zostają na koncie nauczyciela
                payment_intent_data: {
                    metadata: {
                        userEducationalPathId: userEducationalPath.id.toString(),
                        educationalPathId: educationalPathId,
                        userId: user.id,
                        email: email,
                        promoCode: promoCode,
                        discount: discount.toString(),
                        type: paymentType,
                        teacherAccountId: eduPath.author.stripeAccountId,
                        vatInvoiceRequested: vatInvoiceRequested.toString(),
                    }
                },
            }, {
                // Wykonanie na koncie nauczyciela (Connect Account)
                stripeAccount: eduPath.author.stripeAccountId,
            });
        }
        return NextResponse.json({ message: "Checkout session created successfully", sessionUrl: session.url });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}