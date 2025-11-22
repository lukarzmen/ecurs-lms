import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { use } from "react";
import Stripe from "stripe";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const awaitedParams = await params;
        const courseId = awaitedParams.courseId;
        if (!courseId) {
            return new NextResponse("Course Id is required", { status: 400 });
        }

        const body = await req.json();
        const promoCode = body.promoCode || "";
        const vatInvoiceRequested = body.vatInvoiceRequested || false; // Czy klient chce fakturę VAT
        const paymentType = "course";

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

        let userCourse = await db.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: Number(courseId),
                }
            }
        });

        if (!userCourse) {
            // Create userCourse with state 0 (unpaid) - will be updated to 1 by webhook upon successful payment
            userCourse = await db.userCourse.create({
                data: {
                    userId: user.id,
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    courseId: Number(courseId),
                    state: 0, // 0 = unpaid, 1 = paid/enrolled
                }
            });
        }

        const course = await db.course.findUnique({
            where: { id: Number(courseId) },
            select: {
                title: true,
                imageId: true,
                author: {
                    select: {
                        stripeAccountId: true,
                        stripeOnboardingComplete: true
                    }
                },
                price: {
                    select: {
                        amount: true,
                        currency: true,
                        isRecurring: true,
                        interval: true,
                        trialPeriodDays: true,
                        trialPeriodEnd: true,
                        trialPeriodType: true,
                        vatRate: true
                    }
                },
            }
        });
        const price = course?.price;
        
        console.log(`Course data for courseId ${courseId}:`, {
            courseExists: !!course,
            authorData: course?.author,
            priceData: course?.price
        });
        
        if (!course) {
            console.error("Course not found for courseId:", courseId);
            return new NextResponse("Course not found", { status: 404 });
        }

        console.log(`Course ${courseId} author Stripe setup:`, {
            stripeAccountId: course.author.stripeAccountId,
            stripeOnboardingComplete: course.author.stripeOnboardingComplete
        });

        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2025-05-28.basil",
        });

        // Check if teacher has completed Stripe onboarding
        if (!course.author.stripeAccountId || !course.author.stripeOnboardingComplete) {
            console.error(`Teacher payment account not configured for course ${courseId}. StripeAccountId: ${course.author.stripeAccountId}, OnboardingComplete: ${course.author.stripeOnboardingComplete}`);
            return new NextResponse(JSON.stringify({ 
                error: "Autor kursu nie ma skonfigurowanego konta płatności. Skontaktuj się z autorem kursu, aby zakończył konfigurację płatności.",
                details: "Teacher Stripe account not configured"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify that the Stripe account is still active
        try {
            console.log(`Verifying Stripe account: ${course.author.stripeAccountId}`);
            const teacherAccount = await stripeClient.accounts.retrieve(course.author.stripeAccountId);
            if (!teacherAccount.charges_enabled || !teacherAccount.payouts_enabled) {
                console.error(`Teacher Stripe account ${course.author.stripeAccountId} is not fully enabled. Charges: ${teacherAccount.charges_enabled}, Payouts: ${teacherAccount.payouts_enabled}`);
                return new NextResponse(JSON.stringify({ 
                    error: "Konto płatności autora kursu nie jest aktywne. Płatność została anulowana.",
                    details: "Teacher Stripe account not fully enabled"
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            console.log(`Teacher Stripe account ${course.author.stripeAccountId} is active and enabled`);
        } catch (stripeError) {
            console.error(`Failed to verify teacher Stripe account ${course.author.stripeAccountId}:`, stripeError);
            return new NextResponse(JSON.stringify({ 
                error: "Nie można zweryfikować konta płatności autora. Skontaktuj się z autorem kursu.",
                details: "Cannot verify teacher Stripe account"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let stripeCustomerId = user.stripeCustomers[0]?.stripeCustomerId || null;
        console.log(`User info - ID: ${user.id}, Email: ${user.email}, stripeAccountId: ${user.stripeAccountId}`);
        console.log(`Initial stripeCustomerId for user ${user.id}: ${stripeCustomerId}`);
        
        // Validate existing customer or create new one
        if (stripeCustomerId) {
            try {
                // Verify that the customer still exists in Stripe
                console.log(`Verifying Stripe customer: ${stripeCustomerId}`);
                await stripeClient.customers.retrieve(stripeCustomerId);
                console.log(`Stripe customer ${stripeCustomerId} verified successfully`);
            } catch (stripeError: any) {
                // Customer doesn't exist in Stripe anymore, remove from our database and create new one
                console.error(`Stripe customer ${stripeCustomerId} not found, removing from database:`, stripeError?.message);
                
                // Remove invalid customer record
                if (user.stripeCustomers[0]?.id) {
                    await db.stripeCustomer.delete({
                        where: { id: user.stripeCustomers[0].id }
                    });
                    console.log(`Deleted invalid customer record with id: ${user.stripeCustomers[0].id}`);
                }
                stripeCustomerId = null;
            }
        }
        
        if (!stripeCustomerId) {
            console.log(`Creating new Stripe customer for user ${user.id} with email: ${email}`);
            const customer = await stripeClient.customers.create({
                email: email,
            });
            if (!customer) {
                return new NextResponse("Failed to create customer", { status: 500 });
            }
            stripeCustomerId = customer.id;
            console.log(`Created new Stripe customer: ${stripeCustomerId}`);
            await db.stripeCustomer.create({
                data: {
                    stripeCustomerId: stripeCustomerId,
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    userId: user.id,
                },
            });
            console.log(`Saved new customer record to database`);
        }
        
        console.log(`Final stripeCustomerId before checkout: ${stripeCustomerId}`);

        // Calculate price with promo code using new pricing structure
        let finalPrice = Number(price?.amount ?? 0);
        let discount = 0;
        const currency = price?.currency || "pln";
        const isRecurring = price?.isRecurring;
        const interval = price?.interval;
        const vatRate = Number(price?.vatRate ?? 23);
        if (promoCode) {
            // Find all promo code joins for this course
            const joins = await db.coursePromoCode.findMany({
                where: { courseId: Number(courseId) },
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
                console.error("stripeCustomerId is null before creating checkout session");
                return new NextResponse("Customer ID is required for checkout", { status: 500 });
            }
            
            console.log(`Creating subscription checkout session on Connect account: ${course.author.stripeAccountId}`);
            console.log(`Using customer: ${stripeCustomerId}`);
            
            // Create customer on Connect account if needed
            try {
                await stripeClient.customers.retrieve(stripeCustomerId, {
                    stripeAccount: course.author.stripeAccountId
                });
                console.log(`Customer exists on Connect account: ${stripeCustomerId}`);
            } catch (connectError: any) {
                console.log(`Customer doesn't exist on Connect account, creating new one...`);
                // Customer doesn't exist on Connect account, create it
                const connectCustomer = await stripeClient.customers.create({
                    email: email,
                }, {
                    stripeAccount: course.author.stripeAccountId
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
                        stripeAccount: course.author.stripeAccountId
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
                            stripeAccount: course.author.stripeAccountId
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
                                name: course.title,
                                description: "Kurs online",
                                images: course.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${course.imageId}`] : [],
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
                success_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?success=1`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?canceled=1`,
                client_reference_id: String(userCourse.id),
                // NOTE: invoice_creation is not supported in subscription mode - Stripe creates invoices automatically
                metadata: {
                    userCourseId: userCourse.id.toString(),
                    courseId: courseId,
                    userId: String(user.id),
                    email: email,
                    promoCode: promoCode,
                    discount: discount.toString(),
                    mode: "subscription",
                    type: paymentType,
                    teacherAccountId: course.author.stripeAccountId,
                    vatInvoiceRequested: vatInvoiceRequested.toString(),
                },
                subscription_data: {
                    // Only include trial_period_days if it's greater than 0 (Stripe requirement)
                    ...(trialPeriodDays > 0 ? { trial_period_days: trialPeriodDays } : {}),
                    // NIE używamy transfer_data gdy operujemy bezpośrednio na Connect account
                    // Pieniądze automatycznie zostają na koncie nauczyciela
                    metadata: {
                        userCourseId: userCourse.id.toString(),
                        courseId: courseId,
                        userId: user.id,
                        email: email,
                        promoCode: promoCode,
                        discount: discount.toString(),
                        mode: "subscription",
                        type: paymentType,
                        teacherAccountId: course.author.stripeAccountId,
                        vatInvoiceRequested: vatInvoiceRequested.toString(),
                    }
                },
            }, {
                // Wykonanie na koncie nauczyciela (Connect Account)
                stripeAccount: course.author.stripeAccountId,
            });
        } else {
            // One-time payment
            
            // Final validation before creating session
            if (!stripeCustomerId) {
                console.error("stripeCustomerId is null before creating one-time checkout session");
                return new NextResponse("Customer ID is required for checkout", { status: 500 });
            }
            
            console.log(`Creating one-time payment checkout session on Connect account: ${course.author.stripeAccountId}`);
            console.log(`Using customer: ${stripeCustomerId}`);
            
            // Create customer on Connect account if needed
            try {
                await stripeClient.customers.retrieve(stripeCustomerId, {
                    stripeAccount: course.author.stripeAccountId
                });
                console.log(`Customer exists on Connect account: ${stripeCustomerId}`);
            } catch (connectError: any) {
                console.log(`Customer doesn't exist on Connect account, creating new one...`);
                // Customer doesn't exist on Connect account, create it
                const connectCustomer = await stripeClient.customers.create({
                    email: email,
                }, {
                    stripeAccount: course.author.stripeAccountId
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
                        stripeAccount: course.author.stripeAccountId
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
                            stripeAccount: course.author.stripeAccountId
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
                                name: course.title,
                                description: "Kurs online",
                                images: course.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${course.imageId}`] : [],
                            },
                            unit_amount: Math.round(priceWithoutVat * 100), // Price WITHOUT VAT
                            tax_behavior: 'exclusive', // VAT will be added on top
                        },
                        quantity: 1,
                        tax_rates: taxRates, // Apply tax rate
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?success=1`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?canceled=1`,
                client_reference_id: String(userCourse.id),
                // Automatyczne faktury jeśli żądane
                invoice_creation: vatInvoiceRequested ? { 
                    enabled: true,
                    invoice_data: {
                        description: `Kurs online: ${course.title}`,
                        custom_fields: [
                            {
                                name: 'Typ produktu',
                                value: 'Kurs online - usługa cyfrowa'
                            }
                        ]
                    }
                } : undefined,
                metadata: {
                    userCourseId: userCourse.id.toString(),
                    courseId: courseId,
                    userId: String(user.id),
                    email: email,
                    promoCode: promoCode,
                    discount: discount.toString(),
                    mode: "payment",
                    type: paymentType,
                    teacherAccountId: course.author.stripeAccountId,
                    vatInvoiceRequested: vatInvoiceRequested.toString(),
                },
                // NIE używamy payment_intent_data.transfer_data gdy operujemy bezpośrednio na Connect account
                // Pieniądze automatycznie zostają na koncie nauczyciela
                payment_intent_data: {
                    metadata: {
                        userCourseId: userCourse.id.toString(),
                        courseId: courseId,
                        userId: user.id,
                        email: email,
                        promoCode: promoCode,
                        discount: discount.toString(),
                        type: paymentType,
                        teacherAccountId: course.author.stripeAccountId,
                        vatInvoiceRequested: vatInvoiceRequested.toString(),
                    }
                },
            }, {
                // Wykonanie na koncie nauczyciela (Connect Account)
                stripeAccount: course.author.stripeAccountId,
            });
        }
        return NextResponse.json({ message: "Checkout session created successfully", sessionUrl: session.url });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}