import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";


export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    let event: Stripe.Event | undefined;
    let stripeClient: Stripe;
    
    // Sprawdź czy to event z Connect Account (z event data, nie z headera)
    let isConnectEvent: string | null = null;
    
    console.log(`[WEBHOOK] Received request with signature: ${signature?.substring(0, 50)}...`);
    console.log(`[WEBHOOK] Body length: ${body.length} bytes`);
    
    if (!signature) {
        console.error("[WEBHOOK] No stripe-signature header found");
        return new NextResponse("No signature header", { status: 400 });
    }
    
    // Try to parse the event first to determine if it's a Connect event
    // We need to try both secrets to know which one to use
    let webhookSecret: string;
    let eventParseError: any = null;
    
    // First, try to construct event with Connect webhook secret (if available)
    if (process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
        try {
            event = Stripe.webhooks.constructEvent(
                body,
                signature as string,
                process.env.STRIPE_CONNECT_WEBHOOK_SECRET as string
            );
            webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
            console.log(`[WEBHOOK] Successfully verified Connect event: ${event.id} (${event.type})`);
        } catch (err: any) {
            eventParseError = err;
            // If Connect secret fails, try platform secret
            if (process.env.STRIPE_WEBHOOK_SECRET) {
                try {
                    event = Stripe.webhooks.constructEvent(
                        body,
                        signature as string,
                        process.env.STRIPE_WEBHOOK_SECRET as string
                    );
                    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
                    console.log(`[WEBHOOK] Successfully verified platform event: ${event.id} (${event.type})`);
                } catch (err2: any) {
                    console.error("[WEBHOOK] Both webhook secrets failed:", {
                        connectError: err.message,
                        platformError: err2.message,
                        connectSecretPrefix: process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.substring(0, 15),
                        platformSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15)
                    });
                    return new NextResponse(`Webhook Error: ${err2.message}`, { status: 400 });
                }
            } else {
                console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured and STRIPE_CONNECT_WEBHOOK_SECRET failed");
                return new NextResponse("Webhook secret not configured", { status: 500 });
            }
        }
    } else if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Only platform secret is configured
        try {
            event = Stripe.webhooks.constructEvent(
                body,
                signature as string,
                process.env.STRIPE_WEBHOOK_SECRET as string
            );
            webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
            console.log(`[WEBHOOK] Successfully verified event with platform secret: ${event.id} (${event.type})`);
        } catch (err: any) {
            console.error("[WEBHOOK] Platform webhook secret failed:", {
                error: err.message,
                type: err.type,
                secretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15)
            });
            return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
        }
    } else {
        console.error("[WEBHOOK] No webhook secrets configured");
        return new NextResponse("Webhook secret not configured", { status: 500 });
    }
    
    // Ensure event is defined (should always be after successful verification)
    if (!event) {
        console.error("[WEBHOOK] Event is undefined after verification");
        return new NextResponse("Internal error: event undefined", { status: 500 });
    }
    
    // Check if this is a Connect account event from the event data
    isConnectEvent = (event as any).account || null;
    
    // Utwórz klienta Stripe z uwzględnieniem Connect Account
    if (isConnectEvent) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2025-05-28.basil",
            stripeAccount: isConnectEvent
        });
        console.log(`[WEBHOOK] Processing Connect Account event from: ${isConnectEvent}`);
    } else {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2025-05-28.basil"
        });
        console.log(`[WEBHOOK] Processing platform event`);
    }

    // Helper to fetch subscription metadata
    async function getSubscriptionMetadata(stripeClientLocal: Stripe, subscriptionId: string, connectAccount?: string) {
        try {
            const options: any = {};
            if (connectAccount) {
                options.stripeAccount = connectAccount;
            }
            const subscription = await stripeClientLocal.subscriptions.retrieve(subscriptionId, options);
            return subscription.metadata || {};
        } catch (err) {
            console.error("Failed to fetch subscription metadata", err);
            return {};
        }
    }

    // Error logger helper (safe JSON stringify)
    const logError = (tag: string, details: Record<string, any>) => {
        try {
            console.error(`[WEBHOOK][${tag}]`, JSON.stringify(details, null, 2));
        } catch (e) {
            console.error(`[WEBHOOK][${tag}]`, details);
        }
    };

    // Helper to extract payment data from Stripe objects
    function extractPaymentData(stripeObject: any, eventType: string, additionalData?: any): any {
        const baseData = {
            eventType,
            paymentId: stripeObject.id,
            amount: stripeObject.amount || stripeObject.amount_total,
            currency: stripeObject.currency,
            paymentStatus: stripeObject.status || stripeObject.payment_status,
            paymentMethod: stripeObject.payment_method,
            customerEmail: stripeObject.customer_email || stripeObject.receipt_email,
            metadata: stripeObject.metadata,
            stripeCustomerId: stripeObject.customer,
            receiptUrl: stripeObject.receipt_url,
            ...additionalData
        };

        // Add subscription-specific data if available
        if (stripeObject.subscription || additionalData?.subscription) {
            const subscriptionData = additionalData?.subscription || {};
            baseData.subscriptionId = stripeObject.subscription || subscriptionData.id;
            baseData.isRecurring = true;
            baseData.subscriptionStatus = subscriptionData.status;
            baseData.currentPeriodStart = subscriptionData.current_period_start 
                ? new Date(subscriptionData.current_period_start * 1000) 
                : null;
            baseData.currentPeriodEnd = subscriptionData.current_period_end 
                ? new Date(subscriptionData.current_period_end * 1000) 
                : null;
            baseData.trialStart = subscriptionData.trial_start 
                ? new Date(subscriptionData.trial_start * 1000) 
                : null;
            baseData.trialEnd = subscriptionData.trial_end 
                ? new Date(subscriptionData.trial_end * 1000) 
                : null;
        }

        // Add invoice-specific data if available
        if (stripeObject.object === 'invoice' || additionalData?.invoice) {
            const invoiceData = additionalData?.invoice || stripeObject;
            baseData.invoiceId = invoiceData.id;
            baseData.amount = invoiceData.total;
            baseData.currency = invoiceData.currency;
            
            // Add subscription data from invoice if available
            if (invoiceData.subscription && !baseData.subscriptionId) {
                baseData.subscriptionId = invoiceData.subscription;
                baseData.isRecurring = true;
            }
            
            // Add period information from invoice
            if (invoiceData.period_start) {
                baseData.currentPeriodStart = new Date(invoiceData.period_start * 1000);
            }
            if (invoiceData.period_end) {
                baseData.currentPeriodEnd = new Date(invoiceData.period_end * 1000);
            }
        }

        // Add checkout session specific data
        if (stripeObject.object === 'checkout.session') {
            baseData.paymentStatus = stripeObject.payment_status;
            baseData.amount = stripeObject.amount_total;
            baseData.customerEmail = stripeObject.customer_email || stripeObject.customer_details?.email;
            
            // Add subscription data from session if available
            if (stripeObject.subscription && !baseData.subscriptionId) {
                baseData.subscriptionId = stripeObject.subscription;
                baseData.isRecurring = true;
            }
        }

        // Add subscription-specific data if the object itself is a subscription
        if (stripeObject.object === 'subscription') {
            baseData.subscriptionId = stripeObject.id;
            baseData.isRecurring = true;
            baseData.subscriptionStatus = stripeObject.status;
            baseData.currentPeriodStart = stripeObject.current_period_start 
                ? new Date(stripeObject.current_period_start * 1000) 
                : null;
            baseData.currentPeriodEnd = stripeObject.current_period_end 
                ? new Date(stripeObject.current_period_end * 1000) 
                : null;
            baseData.trialStart = stripeObject.trial_start 
                ? new Date(stripeObject.trial_start * 1000) 
                : null;
            baseData.trialEnd = stripeObject.trial_end 
                ? new Date(stripeObject.trial_end * 1000) 
                : null;
            // For subscription, try to get amount from items
            if (stripeObject.items?.data?.[0]) {
                const lineItem = stripeObject.items.data[0];
                if (lineItem.price?.unit_amount) {
                    baseData.amount = lineItem.price.unit_amount;
                }
                if (lineItem.price?.currency) {
                    baseData.currency = lineItem.price.currency;
                }
            }
        }

        return baseData;
    }

    // Enhanced logger for event data
    const logEventData = (tag: string, eventData: any, additionalInfo?: Record<string, any>) => {
        try {
            const logData = {
                eventId: event.id,
                eventType: event.type,
                created: new Date(event.created * 1000).toISOString(),
                livemode: event.livemode,
                ...additionalInfo,
                eventData: {
                    id: eventData.id,
                    object: eventData.object,
                    amount: eventData.amount,
                    amount_received: eventData.amount_received,
                    currency: eventData.currency,
                    customer: eventData.customer,
                    description: eventData.description,
                    metadata: eventData.metadata,
                    status: eventData.status,
                    // For checkout sessions
                    mode: eventData.mode,
                    payment_status: eventData.payment_status,
                    subscription: eventData.subscription,
                    // For invoices
                    subscription_id: eventData.subscription,
                    total: eventData.total,
                    subtotal: eventData.subtotal,
                    // For subscriptions
                    current_period_start: eventData.current_period_start,
                    current_period_end: eventData.current_period_end,
                    // Price information
                    line_items: eventData.line_items,
                    amount_subtotal: eventData.amount_subtotal,
                    amount_total: eventData.amount_total,
                }
            };
            console.log(`[WEBHOOK][${tag}]`, JSON.stringify(logData, null, 2));
        } catch (e) {
            console.log(`[WEBHOOK][${tag}]`, { eventId: event.id, eventType: event.type, error: 'Failed to parse event data' });
        }
    };

    // Helper functions to get price data
    async function getCoursePrice(courseId: number) {
        try {
            const coursePrice = await db.coursePrice.findUnique({
                where: { courseId: courseId }
            });
            return coursePrice;
        } catch (err) {
            console.error("Error fetching course price:", err);
            return null;
        }
    }

    async function getEducationalPathPrice(educationalPathId: number) {
        try {
            const educationalPathPrice = await db.educationalPathPrice.findUnique({
                where: { educationalPathId: educationalPathId }
            });
            return educationalPathPrice;
        } catch (err) {
            console.error("Error fetching educational path price:", err);
            return null;
        }
    }

    // Upsert helpers
    async function upsertCourse(userCourseId: number, appUserId: number, courseId: number, state: number) {
        await db.userCourse.upsert({
            where: { id: userCourseId },
            update: { state },
            create: { id: userCourseId, 
                userId: appUserId, courseId, state, createdAt: new Date(), updatedAt: new Date() },
        });
    }
    async function upsertEduPath(userEducationalPathId: number, appUserId: number, educationalPathId: number, state: number) {
        await db.userEducationalPath.upsert({
            where: { id: userEducationalPathId },
            update: { state, updatedAt: new Date() },
            create: { 
                id: userEducationalPathId, 
                userId: appUserId, 
                educationalPathId, 
                state, 
                createdAt: new Date(), 
                updatedAt: new Date() 
            },
        });
    }
    async function createCoursePurchase(userCourseId: number, paymentId: string, eventData?: any, eventType?: string) {
        const baseData: any = {
            userCourseId,
            paymentId,
            purchaseDate: new Date(),
        };

        // If eventData is provided, extract additional Stripe data
        if (eventData && eventType) {
            const stripeData = extractPaymentData(eventData, eventType);
            Object.assign(baseData, {
                eventType: stripeData.eventType,
                amount: stripeData.amount ? stripeData.amount / 100 : null, // Convert from cents
                currency: stripeData.currency?.toUpperCase(),
                paymentStatus: stripeData.paymentStatus,
                paymentMethod: stripeData.paymentMethod,
                subscriptionId: stripeData.subscriptionId,
                isRecurring: stripeData.isRecurring || false,
                subscriptionStatus: stripeData.subscriptionStatus,
                currentPeriodStart: stripeData.currentPeriodStart,
                currentPeriodEnd: stripeData.currentPeriodEnd,
                trialStart: stripeData.trialStart,
                trialEnd: stripeData.trialEnd,
                customerEmail: stripeData.customerEmail,
                invoiceId: stripeData.invoiceId,
                receiptUrl: stripeData.receiptUrl,
                metadata: stripeData.metadata,
                stripeCustomerId: stripeData.stripeCustomerId,
            });
        }

        // Get course ID from userCourse and fetch price data
        try {
            const userCourse = await db.userCourse.findUnique({
                where: { id: userCourseId },
                select: { courseId: true }
            });
            
            if (userCourse) {
                const coursePrice = await getCoursePrice(userCourse.courseId);
                if (coursePrice) {
                    console.log(`[WEBHOOK] Found course price data for course ${userCourse.courseId}:`, {
                        amount: coursePrice.amount,
                        currency: coursePrice.currency,
                        isRecurring: coursePrice.isRecurring,
                        interval: coursePrice.interval,
                        trialPeriodDays: coursePrice.trialPeriodDays
                    });
                    
                    // Override with price table data if available (unless already set by Stripe data)
                    if (!baseData.amount && coursePrice.amount) {
                        baseData.amount = coursePrice.amount;
                    }
                    if (!baseData.currency && coursePrice.currency) {
                        baseData.currency = coursePrice.currency;
                    }
                    if (!baseData.isRecurring && coursePrice.isRecurring) {
                        baseData.isRecurring = coursePrice.isRecurring;
                    }
                    
                    // Add trial period information from price table
                    if (coursePrice.trialPeriodDays) {
                        const trialStart = new Date();
                        const trialEnd = new Date(trialStart.getTime() + (coursePrice.trialPeriodDays * 24 * 60 * 60 * 1000));
                        if (!baseData.trialStart) {
                            baseData.trialStart = trialStart;
                        }
                        if (!baseData.trialEnd) {
                            baseData.trialEnd = trialEnd;
                        }
                    }
                } else {
                    console.log(`[WEBHOOK] No course price data found for course ${userCourse.courseId}`);
                }
            }
        } catch (err) {
            console.error("Error fetching course price data:", err);
        }

        await db.userCoursePurchase.upsert({
            where: {
                userCourseId: userCourseId,
            },
            update: {
                ...baseData,
                updatedAt: new Date(),
            },
            create: baseData,
        });
    }

    // Enhanced function to create course purchase with detailed payment info
    async function createEnhancedCoursePurchase(
        userCourseId: number, 
        paymentData: {
            paymentId: string;
            eventType: string;
            amount?: number;
            currency?: string;
            paymentStatus?: string;
            paymentMethod?: string;
            subscriptionId?: string;
            isRecurring?: boolean;
            subscriptionStatus?: string;
            currentPeriodStart?: Date;
            currentPeriodEnd?: Date;
            trialStart?: Date;
            trialEnd?: Date;
            customerEmail?: string;
            invoiceId?: string;
            receiptUrl?: string;
            metadata?: any;
            stripeCustomerId?: string;
        }
    ) {
        const baseData: any = {
            userCourseId,
            paymentId: paymentData.paymentId,
            eventType: paymentData.eventType,
            amount: paymentData.amount ? paymentData.amount / 100 : null, // Convert from cents
            currency: paymentData.currency?.toUpperCase(),
            paymentStatus: paymentData.paymentStatus,
            paymentMethod: paymentData.paymentMethod,
            subscriptionId: paymentData.subscriptionId,
            isRecurring: paymentData.isRecurring || false,
            subscriptionStatus: paymentData.subscriptionStatus,
            currentPeriodStart: paymentData.currentPeriodStart,
            currentPeriodEnd: paymentData.currentPeriodEnd,
            trialStart: paymentData.trialStart,
            trialEnd: paymentData.trialEnd,
            customerEmail: paymentData.customerEmail,
            invoiceId: paymentData.invoiceId,
            receiptUrl: paymentData.receiptUrl,
            metadata: paymentData.metadata,
            stripeCustomerId: paymentData.stripeCustomerId,
            purchaseDate: new Date(),
        };

        // Get course ID from userCourse and fetch price data
        try {
            const userCourse = await db.userCourse.findUnique({
                where: { id: userCourseId },
                select: { courseId: true }
            });
            
            if (userCourse) {
                const coursePrice = await getCoursePrice(userCourse.courseId);
                if (coursePrice) {
                    // Override with price table data if available (unless already set by payment data)
                    if (!baseData.amount && coursePrice.amount) {
                        baseData.amount = coursePrice.amount;
                    }
                    if (!baseData.currency && coursePrice.currency) {
                        baseData.currency = coursePrice.currency;
                    }
                    if (!baseData.isRecurring && coursePrice.isRecurring) {
                        baseData.isRecurring = coursePrice.isRecurring;
                    }
                    
                    // Add trial period information from price table if not already set
                    if (coursePrice.trialPeriodDays && !baseData.trialStart && !baseData.trialEnd) {
                        const trialStart = new Date();
                        const trialEnd = new Date(trialStart.getTime() + (coursePrice.trialPeriodDays * 24 * 60 * 60 * 1000));
                        baseData.trialStart = trialStart;
                        baseData.trialEnd = trialEnd;
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching course price data for enhanced purchase:", err);
        }

        await db.userCoursePurchase.upsert({
            where: {
                userCourseId: userCourseId,
            },
            update: {
                ...baseData,
                updatedAt: new Date(),
            },
            create: baseData,
        });
    }
    async function createEduPathPurchase(appUserId: number, educationalPathId: number, paymentId: string, eventData?: any, eventType?: string) {
        const baseData: any = {
            userId: appUserId,
            educationalPathId,
            paymentId,
            purchaseDate: new Date(),
        };

        // If eventData is provided, extract additional Stripe data
        if (eventData && eventType) {
            const stripeData = extractPaymentData(eventData, eventType);
            Object.assign(baseData, {
                eventType: stripeData.eventType,
                amount: stripeData.amount ? stripeData.amount / 100 : null, // Convert from cents
                currency: stripeData.currency?.toUpperCase(),
                paymentStatus: stripeData.paymentStatus,
                paymentMethod: stripeData.paymentMethod,
                subscriptionId: stripeData.subscriptionId,
                isRecurring: stripeData.isRecurring || false,
                subscriptionStatus: stripeData.subscriptionStatus,
                currentPeriodStart: stripeData.currentPeriodStart,
                currentPeriodEnd: stripeData.currentPeriodEnd,
                trialStart: stripeData.trialStart,
                trialEnd: stripeData.trialEnd,
                customerEmail: stripeData.customerEmail,
                invoiceId: stripeData.invoiceId,
                receiptUrl: stripeData.receiptUrl,
                metadata: stripeData.metadata,
                stripeCustomerId: stripeData.stripeCustomerId,
            });
        }

        // Fetch price data from EducationalPathPrice table
        try {
            const educationalPathPrice = await getEducationalPathPrice(educationalPathId);
            if (educationalPathPrice) {
                console.log(`[WEBHOOK] Found educational path price data for path ${educationalPathId}:`, {
                    amount: educationalPathPrice.amount,
                    currency: educationalPathPrice.currency,
                    isRecurring: educationalPathPrice.isRecurring,
                    interval: educationalPathPrice.interval,
                    trialPeriodDays: educationalPathPrice.trialPeriodDays
                });
                
                // Override with price table data if available (unless already set by Stripe data)
                if (!baseData.amount && educationalPathPrice.amount) {
                    baseData.amount = educationalPathPrice.amount;
                }
                if (!baseData.currency && educationalPathPrice.currency) {
                    baseData.currency = educationalPathPrice.currency;
                }
                if (!baseData.isRecurring && educationalPathPrice.isRecurring) {
                    baseData.isRecurring = educationalPathPrice.isRecurring;
                }
                
                // Add trial period information from price table
                if (educationalPathPrice.trialPeriodDays) {
                    const trialStart = new Date();
                    const trialEnd = new Date(trialStart.getTime() + (educationalPathPrice.trialPeriodDays * 24 * 60 * 60 * 1000));
                    if (!baseData.trialStart) {
                        baseData.trialStart = trialStart;
                    }
                    if (!baseData.trialEnd) {
                        baseData.trialEnd = trialEnd;
                    }
                }
            } else {
                console.log(`[WEBHOOK] No educational path price data found for path ${educationalPathId}`);
            }
        } catch (err) {
            console.error("Error fetching educational path price data:", err);
        }

        await db.educationalPathPurchase.upsert({
            where: {
                userId_educationalPathId: {
                    userId: appUserId,
                    educationalPathId: educationalPathId,
                }
            },
            update: {
                ...baseData,
                updatedAt: new Date(),
            },
            create: baseData,
        });

        // Also activate all courses in the educational path
        try {
            const eduPath = await db.educationalPath.findUnique({
                where: { id: educationalPathId },
                include: {
                    courses: {
                        select: { courseId: true }
                    }
                }
            });
            
            if (eduPath?.courses) {
                console.log(`[WEBHOOK] Activating ${eduPath.courses.length} courses for educational path ${educationalPathId}`);
                for (const course of eduPath.courses) {
                    await db.userCourse.upsert({
                        where: {
                            userId_courseId: {
                                userId: appUserId,
                                courseId: course.courseId,
                            }
                        },
                        update: { 
                            state: 1,
                            updatedAt: new Date()
                        },
                        create: {
                            userId: appUserId,
                            courseId: course.courseId,
                            state: 1,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }
                    });
                }
                console.log(`[WEBHOOK] Successfully activated all courses for educational path ${educationalPathId}`);
            } else {
                console.log(`[WEBHOOK] No courses found for educational path ${educationalPathId}`);
            }
        } catch (courseUpdateError) {
            console.error(`[WEBHOOK] Error activating courses for educational path ${educationalPathId}:`, courseUpdateError);
        }
    }

    // Enhanced function to create educational path purchase with detailed payment info
    async function createEnhancedEduPathPurchase(
        appUserId: number, 
        educationalPathId: number, 
        paymentData: {
            paymentId: string;
            eventType: string;
            amount?: number;
            currency?: string;
            paymentStatus?: string;
            paymentMethod?: string;
            subscriptionId?: string;
            isRecurring?: boolean;
            subscriptionStatus?: string;
            currentPeriodStart?: Date;
            currentPeriodEnd?: Date;
            trialStart?: Date;
            trialEnd?: Date;
            customerEmail?: string;
            invoiceId?: string;
            receiptUrl?: string;
            metadata?: any;
            stripeCustomerId?: string;
        }
    ) {
        const baseData: any = {
            userId: appUserId,
            educationalPathId,
            paymentId: paymentData.paymentId,
            eventType: paymentData.eventType,
            amount: paymentData.amount ? paymentData.amount / 100 : null, // Convert from cents
            currency: paymentData.currency?.toUpperCase(),
            paymentStatus: paymentData.paymentStatus,
            paymentMethod: paymentData.paymentMethod,
            subscriptionId: paymentData.subscriptionId,
            isRecurring: paymentData.isRecurring || false,
            subscriptionStatus: paymentData.subscriptionStatus,
            currentPeriodStart: paymentData.currentPeriodStart,
            currentPeriodEnd: paymentData.currentPeriodEnd,
            trialStart: paymentData.trialStart,
            trialEnd: paymentData.trialEnd,
            customerEmail: paymentData.customerEmail,
            invoiceId: paymentData.invoiceId,
            receiptUrl: paymentData.receiptUrl,
            metadata: paymentData.metadata,
            stripeCustomerId: paymentData.stripeCustomerId,
            purchaseDate: new Date(),
        };

        // Fetch price data from EducationalPathPrice table
        try {
            const educationalPathPrice = await getEducationalPathPrice(educationalPathId);
            if (educationalPathPrice) {
                // Override with price table data if available (unless already set by payment data)
                if (!baseData.amount && educationalPathPrice.amount) {
                    baseData.amount = educationalPathPrice.amount;
                }
                if (!baseData.currency && educationalPathPrice.currency) {
                    baseData.currency = educationalPathPrice.currency;
                }
                if (!baseData.isRecurring && educationalPathPrice.isRecurring) {
                    baseData.isRecurring = educationalPathPrice.isRecurring;
                }
                
                // Add trial period information from price table if not already set
                if (educationalPathPrice.trialPeriodDays && !baseData.trialStart && !baseData.trialEnd) {
                    const trialStart = new Date();
                    const trialEnd = new Date(trialStart.getTime() + (educationalPathPrice.trialPeriodDays * 24 * 60 * 60 * 1000));
                    baseData.trialStart = trialStart;
                    baseData.trialEnd = trialEnd;
                }
            }
        } catch (err) {
            console.error("Error fetching educational path price data for enhanced purchase:", err);
        }

        await db.educationalPathPurchase.upsert({
            where: {
                userId_educationalPathId: {
                    userId: appUserId,
                    educationalPathId: educationalPathId,
                }
            },
            update: {
                ...baseData,
                updatedAt: new Date(),
            },
            create: baseData,
        });
    }

    // Basic event receipt log with enhanced details
    try {
        const eventSummary = {
            eventId: event.id,
            eventType: event.type,
            created: new Date(event.created * 1000).toISOString(),
            livemode: event.livemode,
            objectId: (event.data.object as any).id || 'N/A',
            objectType: event.data.object.object,
            connectAccount: isConnectEvent || null,
            metadata: (event.data.object as any).metadata || {},
            amount: (event.data.object as any).amount || (event.data.object as any).amount_total,
            currency: (event.data.object as any).currency,
            customer: (event.data.object as any).customer,
            subscription: (event.data.object as any).subscription,
        };
        console.log(`[WEBHOOK] Received event ${event.type} (${event.id})`, JSON.stringify(eventSummary, null, 2));
    } catch {
        console.log(`[WEBHOOK] Received event ${event.type} (${event.id})`);
    }

    // Centralized event handler
    switch (event.type) {
        case "payment_intent.succeeded": {
            try {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const metadata = paymentIntent.metadata || {};
                
                // Log detailed payment information
                logEventData("PAYMENT_INTENT_SUCCEEDED", paymentIntent, {
                    amountFormatted: `${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
                    paymentMethod: paymentIntent.payment_method,
                    receiptEmail: paymentIntent.receipt_email,
                });
                
                if (metadata.type === "educationalPath") {
                    const appUserId = Number(metadata.userId);
                    const educationalPathId = Number(metadata.educationalPathId);
                    const userEducationalPathId = Number(metadata.userEducationalPathId);
                    if (!appUserId || !educationalPathId || !userEducationalPathId) {
                        // Fallback: try to resolve via charge -> invoice -> subscription metadata for educational path
                        try {
                            if (paymentIntent.latest_charge) {
                                const charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge as string);
                                const invoiceId = (charge as any).invoice as string | undefined;
                                if (invoiceId) {
                                    const invoice = await stripeClient.invoices.retrieve(invoiceId);
                                    const subscriptionId = (invoice as any).subscription as string | undefined;
                                    if (subscriptionId) {
                                        const subMeta = await getSubscriptionMetadata(stripeClient, subscriptionId, isConnectEvent || undefined);
                                        const sUserId = subMeta.userId;
                                        const sEducationalPathId = subMeta.educationalPathId;
                                        const sUserEducationalPathId = subMeta.userEducationalPathId;
                                        if (sUserId && sEducationalPathId && sUserEducationalPathId) {
                                            await upsertEduPath(Number(sUserEducationalPathId), Number(sUserId), Number(sEducationalPathId), 1);
                                            await createEduPathPurchase(Number(sUserId), Number(sEducationalPathId), paymentIntent.id, paymentIntent, event.type);
                                            return NextResponse.json({ success: true }, { status: 200 });
                                        } else {
                                            logError("PI_SUCCEEDED_EDUPATH_MISSING_SUB_META", { eventId: event.id, paymentIntentId: paymentIntent.id, subMeta });
                                        }
                                    } else {
                                        logError("PI_SUCCEEDED_EDUPATH_NO_SUBSCRIPTION", { eventId: event.id, paymentIntentId: paymentIntent.id, invoiceId });
                                    }
                                } else {
                                    logError("PI_SUCCEEDED_EDUPATH_NO_INVOICE", { eventId: event.id, paymentIntentId: paymentIntent.id, chargeId: paymentIntent.latest_charge });
                                }
                            } else {
                                logError("PI_SUCCEEDED_EDUPATH_NO_CHARGE", { eventId: event.id, paymentIntentId: paymentIntent.id });
                            }
                        } catch (err) {
                            logError("PI_SUCCEEDED_EDUPATH_FALLBACK_ERROR", { eventId: event.id, error: String(err) });
                        }
                        return NextResponse.json({ success: false, error: "Missing educational path metadata" }, { status: 200 });
                    }
                    await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 1);
                    
                    // Create purchase record with detailed payment info
                    await createEduPathPurchase(appUserId, educationalPathId, paymentIntent.id, paymentIntent, event.type);
                    
                    return NextResponse.json({ success: true }, { status: 200 });
                } else {
                    // Course payment logic (one-time and fallback for subscriptions)
                    const appUserId = metadata.userId;
                    const courseId = metadata.courseId;
                    const userCourseId = metadata.userCourseId;
                    if (!appUserId || !courseId || !userCourseId) {
                        // Fallback: try to resolve via charge -> invoice -> subscription metadata
                        try {
                            if (paymentIntent.latest_charge) {
                                const charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge as string);
                                const invoiceId = (charge as any).invoice as string | undefined;
                                if (invoiceId) {
                                    const invoice = await stripeClient.invoices.retrieve(invoiceId);
                                    const subscriptionId = (invoice as any).subscription as string | undefined;
                                    if (subscriptionId) {
                                        const subMeta = await getSubscriptionMetadata(stripeClient, subscriptionId, isConnectEvent || undefined);
                                        const sUserId = subMeta.userId;
                                        const sCourseId = subMeta.courseId;
                                        const sUserCourseId = subMeta.userCourseId;
                                        if (sUserId && sCourseId && sUserCourseId) {
                                            await upsertCourse(Number(sUserCourseId), Number(sUserId), Number(sCourseId), 1);
                                            await createCoursePurchase(Number(sUserCourseId), paymentIntent.id, paymentIntent, event.type);
                                            return NextResponse.json({ success: true }, { status: 200 });
                                        } else {
                                            logError("PI_SUCCEEDED_MISSING_SUB_META", { eventId: event.id, paymentIntentId: paymentIntent.id, subMeta });
                                        }
                                    } else {
                                        logError("PI_SUCCEEDED_NO_SUBSCRIPTION", { eventId: event.id, paymentIntentId: paymentIntent.id, invoiceId });
                                    }
                                } else {
                                    logError("PI_SUCCEEDED_NO_INVOICE", { eventId: event.id, paymentIntentId: paymentIntent.id, chargeId: paymentIntent.latest_charge });
                                }
                            } else {
                                logError("PI_SUCCEEDED_NO_CHARGE", { eventId: event.id, paymentIntentId: paymentIntent.id });
                            }
                        } catch (err) {
                            logError("PI_SUCCEEDED_FALLBACK_ERROR", { eventId: event.id, error: String(err) });
                        }
                        return NextResponse.json({ success: true, note: "PI without metadata (likely subscription)" }, { status: 200 });
                    }
                    await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 1);
                    
                    // Create purchase record with detailed payment info
                    await createCoursePurchase(Number(userCourseId), paymentIntent.id, paymentIntent, event.type);
                    
                    return NextResponse.json({ success: true }, { status: 200 });
                }
            } catch (err) {
                logError("PI_SUCCEEDED_HANDLER_ERROR", { eventId: event.id, error: String(err) });
                return NextResponse.json({ success: false }, { status: 200 });
            }
        }
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            
            // Log detailed checkout session information
            logEventData("CHECKOUT_SESSION_COMPLETED", session, {
                amountFormatted: session.amount_total ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}` : 'N/A',
                customerEmail: session.customer_email,
                customerDetails: session.customer_details,
                paymentStatus: session.payment_status,
                subscriptionId: session.subscription,
            });
            
            if (session.mode === "subscription" && session.subscription) {
                const sessMeta = (session.metadata || {}) as any;
                if (sessMeta.type === "platform_subscription") {
                    // Handle platform subscription
                    const appUserId = Number(sessMeta.userId);
                    const teacherSubscriptionId = Number(sessMeta.teacherSubscriptionId);
                    const subscriptionType = sessMeta.subscriptionType;
                    
                    if (!appUserId || !teacherSubscriptionId) {
                        logError("CHECKOUT_COMPLETED_PLATFORM_MISSING_META", { eventId: event.id, sessionId: session.id, sessMeta });
                        return new NextResponse("Missing platform subscription metadata", { status: 400 });
                    }

                    try {
                        // Get subscription details from Stripe
                        const subscriptionMetadata = await getSubscriptionMetadata(stripeClient, session.subscription as string, isConnectEvent || undefined);
                        const paymentData = extractPaymentData(session, event.type, { subscription: subscriptionMetadata });

                        // Update teacher platform subscription
                        // Note: This will work after running Prisma migration
                        await db.teacherPlatformSubscription.update({
                            where: { id: teacherSubscriptionId },
                            data: {
                                paymentId: session.id,
                                eventType: event.type,
                                amount: paymentData.amount ? paymentData.amount / 100 : null,
                                currency: paymentData.currency?.toUpperCase(),
                                paymentStatus: paymentData.paymentStatus,
                                paymentMethod: paymentData.paymentMethod,
                                subscriptionId: session.subscription as string,
                                isRecurring: true,
                                subscriptionStatus: "active",
                                currentPeriodStart: paymentData.currentPeriodStart,
                                currentPeriodEnd: paymentData.currentPeriodEnd,
                                trialStart: paymentData.trialStart,
                                trialEnd: paymentData.trialEnd,
                                customerEmail: paymentData.customerEmail,
                                receiptUrl: paymentData.receiptUrl,
                                metadata: paymentData.metadata,
                                stripeCustomerId: paymentData.stripeCustomerId,
                                updatedAt: new Date(),
                            },
                        });

                        console.log(`[WEBHOOK] Platform subscription activated for user ${appUserId}, subscription ${session.subscription}`);
                    } catch (err) {
                        logError("CHECKOUT_COMPLETED_PLATFORM_ERROR", { eventId: event.id, error: String(err), appUserId, teacherSubscriptionId });
                        return NextResponse.json({ success: false }, { status: 200 });
                    }
                } else if (sessMeta.type === "educationalPath") {
                    const appUserId = Number(sessMeta.userId);
                    const educationalPathId = Number(sessMeta.educationalPathId);
                    const userEducationalPathId = Number(sessMeta.userEducationalPathId || session.client_reference_id);
                    const teacherAccountId = sessMeta.teacherAccountId; // Get Connect account ID from metadata
                    if (!appUserId || !educationalPathId || !userEducationalPathId) {
                        logError("CHECKOUT_COMPLETED_EDUPATH_MISSING_META", { eventId: event.id, sessionId: session.id, sessMeta });
                        return new NextResponse("Missing educational path metadata", { status: 400 });
                    }
                    await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 1);
                    
                    // Also activate all courses in the educational path
                    try {
                        const eduPath = await db.educationalPath.findUnique({
                            where: { id: educationalPathId },
                            include: {
                                courses: {
                                    select: { courseId: true }
                                }
                            }
                        });
                        
                        if (eduPath?.courses) {
                            for (const course of eduPath.courses) {
                                await db.userCourse.upsert({
                                    where: {
                                        userId_courseId: {
                                            userId: appUserId,
                                            courseId: course.courseId,
                                        }
                                    },
                                    update: { 
                                        state: 1,
                                        updatedAt: new Date()
                                    },
                                    create: {
                                        userId: appUserId,
                                        courseId: course.courseId,
                                        state: 1,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    }
                                });
                            }
                        }
                    } catch (courseUpdateError) {
                        logError("CHECKOUT_COMPLETED_EDUPATH_COURSE_UPDATE_ERROR", { 
                            eventId: event.id, 
                            sessionId: session.id, 
                            educationalPathId, 
                            error: String(courseUpdateError) 
                        });
                    }
                    
                    // Get full subscription details for educational path purchase
                    try {
                        // Use teacherAccountId from metadata if not a Connect event
                        const stripeAccountForSub = isConnectEvent || teacherAccountId;
                        const fullSubscription = await stripeClient.subscriptions.retrieve(session.subscription as string, {
                            stripeAccount: stripeAccountForSub || undefined
                        });
                        await createEduPathPurchase(appUserId, educationalPathId, session.id, fullSubscription, event.type);
                    } catch (err) {
                        logError("CHECKOUT_COMPLETED_EDUPATH_PURCHASE_ERROR", { 
                            eventId: event.id, 
                            sessionId: session.id, 
                            educationalPathId, 
                            error: String(err) 
                        });
                        await createEduPathPurchase(appUserId, educationalPathId, session.id, session, event.type);
                    }
                    return NextResponse.json({ success: true }, { status: 200 });
                    } else {
                        // Course subscription logic
                        try {
                            // Prefer subscription metadata; if missing, fallback to session.metadata
                            const subMeta = await getSubscriptionMetadata(stripeClient, session.subscription as string, isConnectEvent || undefined);
                            const sessMeta = (session.metadata || {}) as any;
                            const appUserId = (subMeta as any).userId || sessMeta.userId;
                            const courseId = (subMeta as any).courseId || sessMeta.courseId;
                            const userCourseId = (subMeta as any).userCourseId || sessMeta.userCourseId || session.client_reference_id;
                            const teacherAccountId = sessMeta.teacherAccountId; // Get Connect account ID from session metadata
                            if (!appUserId || !courseId || !userCourseId) {
                                logError("CHECKOUT_COMPLETED_MISSING_META", { eventId: event.id, sessionId: session.id, subMeta, sessMeta });
                                return new NextResponse("Missing metadata", { status: 400 });
                            }
                            await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 1);
                            
                            // Get full subscription details and create purchase with full data
                            try {
                                // Use teacherAccountId from metadata if not a Connect event
                                const stripeAccountForSub = isConnectEvent || teacherAccountId;
                                const fullSubscription = await stripeClient.subscriptions.retrieve(session.subscription as string, {
                                    stripeAccount: stripeAccountForSub || undefined
                                });
                                await createCoursePurchase(Number(userCourseId), session.id, fullSubscription, event.type);
                            } catch (purchaseErr) {
                                logError("CHECKOUT_COMPLETED_COURSE_PURCHASE_ERROR", { 
                                    eventId: event.id, 
                                    sessionId: session.id, 
                                    userCourseId, 
                                    error: String(purchaseErr) 
                                });
                                await createCoursePurchase(Number(userCourseId), session.id, session, event.type);
                            }                        // Try to attach metadata to the initial PaymentIntent via latest invoice for better traceability
                        try {
                            const subscriptionOptions: any = {
                                expand: ["latest_invoice.payment_intent"],
                            };
                            if (isConnectEvent) {
                                subscriptionOptions.stripeAccount = isConnectEvent;
                            }
                            const subscription = await stripeClient.subscriptions.retrieve(session.subscription as string, subscriptionOptions);
                            const latestInvoiceAny = (subscription as any).latest_invoice as any;
                            const piObjOrId = latestInvoiceAny && latestInvoiceAny.payment_intent;
                            const piId = typeof piObjOrId === "string" ? piObjOrId : piObjOrId?.id;
                            if (piId) {
                                const updateOptions: any = {
                                    metadata: {
                                        userCourseId: String(userCourseId),
                                        courseId: String(courseId),
                                        userId: String(appUserId),
                                        mode: "subscription",
                                    }
                                };
                                if (isConnectEvent) {
                                    updateOptions.stripeAccount = isConnectEvent;
                                }
                                await stripeClient.paymentIntents.update(piId, updateOptions);
                            }
                        } catch (err) {
                            logError("CHECKOUT_COMPLETED_PI_META_UPDATE_FAIL", { eventId: event.id, sessionId: session.id, error: String(err) });
                        }
                        return NextResponse.json({ success: true }, { status: 200 });
                    } catch (err) {
                        logError("CHECKOUT_COMPLETED_HANDLER_ERROR", { eventId: event.id, error: String(err) });
                        return NextResponse.json({ success: false }, { status: 200 });
                    }
                }
            }
            break;
        }
        case "checkout.session.async_payment_failed": {
            const session = event.data.object as Stripe.Checkout.Session;
            
            // Log detailed failed checkout session information
            logEventData("CHECKOUT_SESSION_ASYNC_PAYMENT_FAILED", session, {
                amountFormatted: session.amount_total ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}` : 'N/A',
                customerEmail: session.customer_email,
                customerDetails: session.customer_details,
                paymentStatus: session.payment_status,
                subscriptionId: session.subscription,
            });
            
            const sessMeta = (session.metadata || {}) as any;
            if (sessMeta.type === "platform_subscription") {
                // Handle failed platform subscription payment
                const appUserId = Number(sessMeta.userId);
                const teacherSubscriptionId = Number(sessMeta.teacherSubscriptionId);
                
                if (!appUserId || !teacherSubscriptionId) {
                    logError("CHECKOUT_ASYNC_FAILED_PLATFORM_MISSING_META", { eventId: event.id, sessionId: session.id, sessMeta });
                    return new NextResponse("Missing platform subscription metadata", { status: 400 });
                }

                try {
                    // Note: This will work after running Prisma migration
                    await db.teacherPlatformSubscription.update({
                        where: { id: teacherSubscriptionId },
                        data: {
                            paymentStatus: "failed",
                            subscriptionStatus: "payment_failed",
                            updatedAt: new Date(),
                        },
                    });

                    console.log(`[WEBHOOK] Platform subscription payment failed for user ${appUserId}`);
                } catch (err) {
                    logError("CHECKOUT_ASYNC_FAILED_PLATFORM_ERROR", { eventId: event.id, error: String(err) });
                }
            } else if (sessMeta.type === "educationalPath") {
                const appUserId = Number(sessMeta.userId);
                const educationalPathId = Number(sessMeta.educationalPathId);
                const userEducationalPathId = Number(sessMeta.userEducationalPathId || session.client_reference_id);
                if (!appUserId || !educationalPathId || !userEducationalPathId) {
                    logError("CHECKOUT_ASYNC_FAILED_EDUPATH_MISSING_META", { eventId: event.id, sessionId: session.id, sessMeta });
                    return new NextResponse("Missing educational path metadata", { status: 400 });
                }
                await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 0);
                
                // Also deactivate all courses in the educational path
                try {
                    const eduPath = await db.educationalPath.findUnique({
                        where: { id: educationalPathId },
                        include: {
                            courses: {
                                select: { courseId: true }
                            }
                        }
                    });
                    
                    if (eduPath?.courses) {
                        for (const course of eduPath.courses) {
                            await db.userCourse.upsert({
                                where: {
                                    userId_courseId: {
                                        userId: appUserId,
                                        courseId: course.courseId,
                                    }
                                },
                                update: { 
                                    state: 0,
                                    updatedAt: new Date()
                                },
                                create: {
                                    userId: appUserId,
                                    courseId: course.courseId,
                                    state: 0,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                }
                            });
                        }
                    }
                } catch (courseUpdateError) {
                    logError("CHECKOUT_ASYNC_FAILED_EDUPATH_COURSE_UPDATE_ERROR", { 
                        eventId: event.id, 
                        sessionId: session.id, 
                        educationalPathId, 
                        error: String(courseUpdateError) 
                    });
                }
                
                return NextResponse.json({ success: true }, { status: 200 });
            } else {
                // Course logic - set state to 0 for failed payment
                const appUserId = sessMeta.userId;
                const courseId = sessMeta.courseId;
                const userCourseId = sessMeta.userCourseId || session.client_reference_id;
                if (!appUserId || !courseId || !userCourseId) {
                    logError("CHECKOUT_ASYNC_FAILED_MISSING_META", { eventId: event.id, sessionId: session.id, sessMeta });
                    return new NextResponse("Missing metadata", { status: 400 });
                }
                await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 0);
                return NextResponse.json({ success: true }, { status: 200 });
            }
            break;
        }
        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            // Support both old and new Stripe API structures
            let subscriptionId = (invoice as any).subscription;
            let paymentIntentId = (invoice as any).payment_intent;
            
            // New Stripe API structure (2025-04-30.basil) - check parent.subscription_details
            if (!subscriptionId && (invoice as any).parent?.subscription_details?.subscription) {
                subscriptionId = (invoice as any).parent.subscription_details.subscription;
            }
            
            console.log(`[WEBHOOK] Invoice.paid - subscriptionId: ${subscriptionId}, paymentIntentId: ${paymentIntentId}, total: ${invoice.total}, billing_reason: ${invoice.billing_reason}`);
            
            // Log detailed invoice information
            logEventData("INVOICE_PAID", invoice, {
                amountFormatted: invoice.total ? `${(invoice.total / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}` : 'N/A',
                customerEmail: invoice.customer_email,
                subscriptionId: subscriptionId,
                paymentIntentId: paymentIntentId,
                invoiceNumber: invoice.number,
                billingReason: invoice.billing_reason,
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
                periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
                periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            });
            
            if (subscriptionId) {
                // Subscription-based invoice
                // First check if invoice has metadata directly, then check line items, finally get from subscription
                let metadata = invoice.metadata || {};
                
                // If no metadata on invoice, try to get from line items
                if (!metadata.type || Object.keys(metadata).length === 0) {
                    try {
                        if (invoice.id) {
                            const lineItems = await stripeClient.invoices.listLineItems(invoice.id as string, { limit: 10 });
                            if (lineItems.data && lineItems.data.length > 0) {
                                const firstLineItem = lineItems.data[0];
                                if (firstLineItem.metadata && Object.keys(firstLineItem.metadata).length > 0) {
                                    metadata = firstLineItem.metadata;
                                    console.log(`[WEBHOOK] Found metadata in line items:`, JSON.stringify(metadata, null, 2));
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`[WEBHOOK] Error fetching line items:`, err);
                    }
                }
                
                // If still no metadata, get from subscription
                if (!metadata.type || Object.keys(metadata).length === 0) {
                    metadata = await getSubscriptionMetadata(stripeClient, subscriptionId as string, isConnectEvent || undefined);
                }
                
                console.log(`[WEBHOOK] Invoice.paid final metadata:`, JSON.stringify(metadata, null, 2));
                
                if (metadata.type === "educationalPath") {
                    const appUserId = Number(metadata.userId);
                    const educationalPathId = Number(metadata.educationalPathId);
                    const userEducationalPathId = Number(metadata.userEducationalPathId);
                    if (!appUserId || !educationalPathId || !userEducationalPathId) {
                        logError("INVOICE_PAID_EDUPATH_MISSING_META", { eventId: event.id, invoiceId: invoice.id, metadata });
                        return new NextResponse("Missing educational path metadata", { status: 400 });
                    }
                    await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 1);
                    
                    // Also activate all courses in the educational path
                    try {
                        const eduPath = await db.educationalPath.findUnique({
                            where: { id: educationalPathId },
                            include: {
                                courses: {
                                    select: { courseId: true }
                                }
                            }
                        });
                        
                        if (eduPath?.courses) {
                            for (const course of eduPath.courses) {
                                await db.userCourse.upsert({
                                    where: {
                                        userId_courseId: {
                                            userId: appUserId,
                                            courseId: course.courseId,
                                        }
                                    },
                                    update: { 
                                        state: 1,
                                        updatedAt: new Date()
                                    },
                                    create: {
                                        userId: appUserId,
                                        courseId: course.courseId,
                                        state: 1,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    }
                                });
                            }
                        }
                    } catch (courseUpdateError) {
                        logError("INVOICE_PAID_EDUPATH_COURSE_UPDATE_ERROR", { 
                            eventId: event.id, 
                            invoiceId: invoice.id, 
                            educationalPathId, 
                            error: String(courseUpdateError) 
                        });
                    }
                    
                    // Get full subscription details for purchase record
                    try {
                        const fullSubscription = await stripeClient.subscriptions.retrieve(subscriptionId as string, {
                            stripeAccount: isConnectEvent || undefined
                        });
                        await createEduPathPurchase(appUserId, educationalPathId, paymentIntentId || subscriptionId || invoice.id || 'unknown', fullSubscription, event.type);
                    } catch (err) {
                        logError("INVOICE_PAID_EDUPATH_PURCHASE_ERROR", { 
                            eventId: event.id, 
                            invoiceId: invoice.id, 
                            educationalPathId, 
                            error: String(err) 
                        });
                        await createEduPathPurchase(appUserId, educationalPathId, paymentIntentId || subscriptionId || invoice.id || 'unknown', invoice, event.type);
                    }
                    return NextResponse.json({ success: true }, { status: 200 });
                } else {
                    // Course subscription logic
                    const appUserId = metadata.userId;
                    const courseId = metadata.courseId;
                    const userCourseId = metadata.userCourseId;
                    if (!appUserId || !courseId || !userCourseId) {
                        logError("INVOICE_PAID_MISSING_META", { eventId: event.id, invoiceId: invoice.id, metadata });
                        return new NextResponse("Missing metadata", { status: 400 });
                    }
                    await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 1);
                    
                    // Get full subscription details for purchase record
                    try {
                        const fullSubscription = await stripeClient.subscriptions.retrieve(subscriptionId as string, {
                            stripeAccount: isConnectEvent || undefined
                        });
                        await createCoursePurchase(Number(userCourseId), paymentIntentId || subscriptionId || invoice.id || 'unknown', fullSubscription, event.type);
                    } catch (err) {
                        logError("INVOICE_PAID_COURSE_PURCHASE_ERROR", { 
                            eventId: event.id, 
                            invoiceId: invoice.id, 
                            userCourseId, 
                            error: String(err) 
                        });
                        await createCoursePurchase(Number(userCourseId), paymentIntentId || subscriptionId || invoice.id || 'unknown', invoice, event.type);
                    }
                    return NextResponse.json({ success: true }, { status: 200 });
                }
            } else if (paymentIntentId) {
                // One-time payment invoice (no subscription) - get metadata from PaymentIntent
                console.log(`[WEBHOOK] Processing one-time payment invoice ${invoice.id} with payment_intent ${paymentIntentId}`);
                try {
                    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId as string);
                    const metadata = paymentIntent.metadata || {};
                    
                    if (metadata.type === "educationalPath") {
                        const appUserId = Number(metadata.userId);
                        const educationalPathId = Number(metadata.educationalPathId);
                        const userEducationalPathId = Number(metadata.userEducationalPathId);
                        if (!appUserId || !educationalPathId || !userEducationalPathId) {
                            logError("INVOICE_PAID_ONETIME_EDUPATH_MISSING_META", { eventId: event.id, invoiceId: invoice.id, paymentIntentId, metadata });
                            return new NextResponse("Missing educational path metadata", { status: 400 });
                        }
                        await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 1);
                        
                        // Also activate all courses in the educational path
                        try {
                            const eduPath = await db.educationalPath.findUnique({
                                where: { id: educationalPathId },
                                include: {
                                    courses: {
                                        select: { courseId: true }
                                    }
                                }
                            });
                            
                            if (eduPath?.courses) {
                                for (const course of eduPath.courses) {
                                    await db.userCourse.upsert({
                                        where: {
                                            userId_courseId: {
                                                userId: appUserId,
                                                courseId: course.courseId,
                                            }
                                        },
                                        update: { 
                                            state: 1,
                                            updatedAt: new Date()
                                        },
                                        create: {
                                            userId: appUserId,
                                            courseId: course.courseId,
                                            state: 1,
                                            createdAt: new Date(),
                                            updatedAt: new Date(),
                                        }
                                    });
                                }
                            }
                        } catch (courseUpdateError) {
                            logError("INVOICE_PAID_ONETIME_EDUPATH_COURSE_UPDATE_ERROR", { 
                                eventId: event.id, 
                                invoiceId: invoice.id, 
                                educationalPathId, 
                                error: String(courseUpdateError) 
                            });
                        }
                        
                        await createEduPathPurchase(appUserId, educationalPathId, paymentIntentId as string, invoice, event.type);
                        return NextResponse.json({ success: true }, { status: 200 });
                    } else {
                        // Course one-time payment
                        const appUserId = metadata.userId;
                        const courseId = metadata.courseId;
                        const userCourseId = metadata.userCourseId;
                        if (!appUserId || !courseId || !userCourseId) {
                            logError("INVOICE_PAID_ONETIME_MISSING_META", { eventId: event.id, invoiceId: invoice.id, paymentIntentId, metadata });
                            return new NextResponse("Missing metadata", { status: 400 });
                        }
                        await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 1);
                        await createCoursePurchase(Number(userCourseId), paymentIntentId as string, invoice, event.type);
                        return NextResponse.json({ success: true }, { status: 200 });
                    }
                } catch (err) {
                    logError("INVOICE_PAID_ONETIME_PI_RETRIEVE_ERROR", { eventId: event.id, invoiceId: invoice.id, paymentIntentId, error: String(err) });
                    return NextResponse.json({ success: false, error: "Failed to retrieve payment intent metadata" }, { status: 200 });
                }
            } else {
                // Invoice without subscription or payment_intent - log and skip
                console.log(`[WEBHOOK] Skipping invoice.paid ${invoice.id} - no subscription or payment_intent found`);
                return NextResponse.json({ success: true, note: "Invoice without subscription or payment_intent" }, { status: 200 });
            }
            break;
        }
        case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const subscriptionId = (invoice as any)['subscription'];
            
            // Log detailed failed invoice information
            logEventData("INVOICE_PAYMENT_FAILED", invoice, {
                amountFormatted: invoice.total ? `${(invoice.total / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}` : 'N/A',
                customerEmail: invoice.customer_email,
                subscriptionId: subscriptionId,
                invoiceNumber: invoice.number,
                attemptCount: invoice.attempt_count,
                nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
            });
            
            if (subscriptionId) {
                const metadata = await getSubscriptionMetadata(stripeClient, subscriptionId as string, isConnectEvent || undefined);
                if (metadata.type === "educationalPath") {
                    const appUserId = Number(metadata.userId);
                    const educationalPathId = Number(metadata.educationalPathId);
                    const userEducationalPathId = Number(metadata.userEducationalPathId);
                    if (!appUserId || !educationalPathId || !userEducationalPathId) {
                        logError("INVOICE_FAILED_EDUPATH_MISSING_META", { eventId: event.id, invoiceId: invoice.id, metadata });
                        return new NextResponse("Missing educational path metadata", { status: 400 });
                    }
                    await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 0);
                    
                    // Also deactivate all courses in the educational path
                    try {
                        const eduPath = await db.educationalPath.findUnique({
                            where: { id: educationalPathId },
                            include: {
                                courses: {
                                    select: { courseId: true }
                                }
                            }
                        });
                        
                        if (eduPath?.courses) {
                            for (const course of eduPath.courses) {
                                await db.userCourse.upsert({
                                    where: {
                                        userId_courseId: {
                                            userId: appUserId,
                                            courseId: course.courseId,
                                        }
                                    },
                                    update: { 
                                        state: 0,
                                        updatedAt: new Date()
                                    },
                                    create: {
                                        userId: appUserId,
                                        courseId: course.courseId,
                                        state: 0,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    }
                                });
                            }
                        }
                    } catch (courseUpdateError) {
                        logError("INVOICE_FAILED_EDUPATH_COURSE_UPDATE_ERROR", { 
                            eventId: event.id, 
                            invoiceId: invoice.id, 
                            educationalPathId, 
                            error: String(courseUpdateError) 
                        });
                    }
                    
                    return NextResponse.json({ success: true }, { status: 200 });
                } else {
                    // Course subscription logic (revoke)
                    const appUserId = metadata.userId;
                    const courseId = metadata.courseId;
                    const userCourseId = metadata.userCourseId;
                    if (!appUserId || !courseId || !userCourseId) {
                        logError("INVOICE_FAILED_MISSING_META", { eventId: event.id, invoiceId: invoice.id, metadata });
                        return new NextResponse("Missing metadata", { status: 400 });
                    }
                    await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 0);
                    return NextResponse.json({ success: true }, { status: 200 });
                }
            } else {
                // One-time payment invoice failure (no subscription) - get metadata from PaymentIntent
                const paymentIntentId = (invoice as any)['payment_intent'];
                if (paymentIntentId) {
                    console.log(`[WEBHOOK] Processing one-time payment failed invoice ${invoice.id} with payment_intent ${paymentIntentId}`);
                    try {
                        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId as string);
                        const metadata = paymentIntent.metadata || {};
                        
                        if (metadata.type === "educationalPath") {
                            const appUserId = Number(metadata.userId);
                            const educationalPathId = Number(metadata.educationalPathId);
                            const userEducationalPathId = Number(metadata.userEducationalPathId);
                            if (!appUserId || !educationalPathId || !userEducationalPathId) {
                                logError("INVOICE_FAILED_ONETIME_EDUPATH_MISSING_META", { eventId: event.id, invoiceId: invoice.id, paymentIntentId, metadata });
                                return new NextResponse("Missing educational path metadata", { status: 400 });
                            }
                            await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 0);
                            
                            // Also deactivate all courses in the educational path
                            try {
                                const eduPath = await db.educationalPath.findUnique({
                                    where: { id: educationalPathId },
                                    include: {
                                        courses: {
                                            select: { courseId: true }
                                        }
                                    }
                                });
                                
                                if (eduPath?.courses) {
                                    for (const course of eduPath.courses) {
                                        await db.userCourse.upsert({
                                            where: {
                                                userId_courseId: {
                                                    userId: appUserId,
                                                    courseId: course.courseId,
                                                }
                                            },
                                            update: { 
                                                state: 0,
                                                updatedAt: new Date()
                                            },
                                            create: {
                                                userId: appUserId,
                                                courseId: course.courseId,
                                                state: 0,
                                                createdAt: new Date(),
                                                updatedAt: new Date(),
                                            }
                                        });
                                    }
                                }
                            } catch (courseUpdateError) {
                                logError("INVOICE_FAILED_ONETIME_EDUPATH_COURSE_UPDATE_ERROR", { 
                                    eventId: event.id, 
                                    invoiceId: invoice.id, 
                                    educationalPathId, 
                                    error: String(courseUpdateError) 
                                });
                            }
                            
                            return NextResponse.json({ success: true }, { status: 200 });
                        } else {
                            // Course one-time payment failure
                            const appUserId = metadata.userId;
                            const courseId = metadata.courseId;
                            const userCourseId = metadata.userCourseId;
                            if (!appUserId || !courseId || !userCourseId) {
                                logError("INVOICE_FAILED_ONETIME_MISSING_META", { eventId: event.id, invoiceId: invoice.id, paymentIntentId, metadata });
                                return new NextResponse("Missing metadata", { status: 400 });
                            }
                            await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 0);
                            return NextResponse.json({ success: true }, { status: 200 });
                        }
                    } catch (err) {
                        logError("INVOICE_FAILED_ONETIME_PI_RETRIEVE_ERROR", { eventId: event.id, invoiceId: invoice.id, paymentIntentId, error: String(err) });
                        return NextResponse.json({ success: false, error: "Failed to retrieve payment intent metadata" }, { status: 200 });
                    }
                } else {
                    console.log(`[WEBHOOK] Skipping invoice.payment_failed ${invoice.id} - no subscription or payment_intent found`);
                    return NextResponse.json({ success: true, note: "Invoice without subscription or payment_intent" }, { status: 200 });
                }
            }
            break;
        }
        case "payment_intent.payment_failed": {
            try {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const metadata = paymentIntent.metadata || {} as any;
                
                // Log detailed failed payment information
                logEventData("PAYMENT_INTENT_FAILED", paymentIntent, {
                    amountFormatted: `${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`,
                    lastPaymentError: paymentIntent.last_payment_error,
                    cancellationReason: paymentIntent.cancellation_reason,
                });
                
                if (metadata.type === "educationalPath") {
                    const appUserId = Number(metadata.userId);
                    const educationalPathId = Number(metadata.educationalPathId);
                    const userEducationalPathId = Number(metadata.userEducationalPathId);
                    if (!appUserId || !educationalPathId || !userEducationalPathId) {
                        // Fallback: try to resolve via charge -> invoice -> subscription metadata for educational path
                        try {
                            if (paymentIntent.latest_charge) {
                                const charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge as string);
                                const invoiceId = (charge as any).invoice as string | undefined;
                                if (invoiceId) {
                                    const invoice = await stripeClient.invoices.retrieve(invoiceId);
                                    const subscriptionId = (invoice as any).subscription as string | undefined;
                                    if (subscriptionId) {
                                        const subMeta = await getSubscriptionMetadata(stripeClient, subscriptionId, isConnectEvent || undefined);
                                        const sUserId = subMeta.userId;
                                        const sEducationalPathId = subMeta.educationalPathId;
                                        const sUserEducationalPathId = subMeta.userEducationalPathId;
                                        if (sUserId && sEducationalPathId && sUserEducationalPathId) {
                                            await upsertEduPath(Number(sUserEducationalPathId), Number(sUserId), Number(sEducationalPathId), 0);
                                            // Also deactivate all courses in the educational path
                                            try {
                                                const eduPath = await db.educationalPath.findUnique({
                                                    where: { id: Number(sEducationalPathId) },
                                                    include: {
                                                        courses: {
                                                            select: { courseId: true }
                                                        }
                                                    }
                                                });
                                                
                                                if (eduPath?.courses) {
                                                    for (const course of eduPath.courses) {
                                                        await db.userCourse.upsert({
                                                            where: {
                                                                userId_courseId: {
                                                                    userId: Number(sUserId),
                                                                    courseId: course.courseId,
                                                                }
                                                            },
                                                            update: { 
                                                                state: 0,
                                                                updatedAt: new Date()
                                                            },
                                                            create: {
                                                                userId: Number(sUserId),
                                                                courseId: course.courseId,
                                                                state: 0,
                                                                createdAt: new Date(),
                                                                updatedAt: new Date(),
                                                            }
                                                        });
                                                    }
                                                }
                                            } catch (courseUpdateError) {
                                                logError("PAYMENT_INTENT_FAILED_EDUPATH_FALLBACK_COURSE_UPDATE_ERROR", { 
                                                    eventId: event.id, 
                                                    paymentIntentId: paymentIntent.id, 
                                                    educationalPathId: sEducationalPathId, 
                                                    error: String(courseUpdateError) 
                                                });
                                            }
                                            return NextResponse.json({ success: true }, { status: 200 });
                                        } else {
                                            logError("PI_FAILED_EDUPATH_MISSING_SUB_META", { eventId: event.id, paymentIntentId: paymentIntent.id, subMeta });
                                        }
                                    } else {
                                        logError("PI_FAILED_EDUPATH_NO_SUBSCRIPTION", { eventId: event.id, paymentIntentId: paymentIntent.id, invoiceId });
                                    }
                                } else {
                                    logError("PI_FAILED_EDUPATH_NO_INVOICE", { eventId: event.id, paymentIntentId: paymentIntent.id, chargeId: paymentIntent.latest_charge });
                                }
                            } else {
                                logError("PI_FAILED_EDUPATH_NO_CHARGE", { eventId: event.id, paymentIntentId: paymentIntent.id });
                            }
                        } catch (err) {
                            logError("PI_FAILED_EDUPATH_FALLBACK_ERROR", { eventId: event.id, error: String(err) });
                        }
                        return NextResponse.json({ success: false, error: "Missing educational path metadata" }, { status: 200 });
                    }
                    await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 0);
                    
                    // Also deactivate all courses in the educational path
                    try {
                        const eduPath = await db.educationalPath.findUnique({
                            where: { id: educationalPathId },
                            include: {
                                courses: {
                                    select: { courseId: true }
                                }
                            }
                        });
                        
                        if (eduPath?.courses) {
                            for (const course of eduPath.courses) {
                                await db.userCourse.upsert({
                                    where: {
                                        userId_courseId: {
                                            userId: appUserId,
                                            courseId: course.courseId,
                                        }
                                    },
                                    update: { 
                                        state: 0,
                                        updatedAt: new Date()
                                    },
                                    create: {
                                        userId: appUserId,
                                        courseId: course.courseId,
                                        state: 0,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    }
                                });
                            }
                        }
                    } catch (courseUpdateError) {
                        logError("PAYMENT_INTENT_FAILED_EDUPATH_COURSE_UPDATE_ERROR", { 
                            eventId: event.id, 
                            paymentIntentId: paymentIntent.id, 
                            educationalPathId, 
                            error: String(courseUpdateError) 
                        });
                    }
                    
                    return NextResponse.json({ success: true }, { status: 200 });
                } else {
                    // Course payment failed logic
                    let appUserId = metadata.userId as string | undefined;
                    let courseId = metadata.courseId as string | undefined;
                    let userCourseId = metadata.userCourseId as string | undefined;
                    if (!appUserId || !courseId || !userCourseId) {
                        // For subscriptions, PI may lack metadata. Try resolving via latest_charge -> invoice -> subscription.
                        try {
                            if (paymentIntent.latest_charge) {
                                const charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge as string);
                                const invoiceId = (charge as any).invoice as string | undefined;
                                if (invoiceId) {
                                    const invoice = await stripeClient.invoices.retrieve(invoiceId);
                                    const subscriptionId = (invoice as any).subscription as string | undefined;
                                    if (subscriptionId) {
                                        const subMeta = await getSubscriptionMetadata(stripeClient, subscriptionId, isConnectEvent || undefined);
                                        appUserId = (subMeta as any).userId;
                                        courseId = (subMeta as any).courseId;
                                        userCourseId = (subMeta as any).userCourseId;
                                    }
                                }
                            }
                        } catch (err) {
                            logError("PI_FAILED_RESOLVE_META_ERROR", { eventId: event.id, paymentIntentId: paymentIntent.id, error: String(err) });
                        }
                    }
                    if (appUserId && courseId && userCourseId) {
                        await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 0);
                    } else {
                        logError("PI_FAILED_MISSING_META", { eventId: event.id, paymentIntentId: paymentIntent.id, metadata });
                    }
                    return NextResponse.json({ success: true }, { status: 200 });
                }
            } catch (err) {
                logError("PI_FAILED_HANDLER_ERROR", { eventId: event.id, error: String(err) });
                return NextResponse.json({ success: false }, { status: 200 });
            }
            break;
        }
        default:
            return NextResponse.json({
                success: false,
                message: `Webhook event type error ${event.type} not handled yet. Please contact support if you see this message.`,
            }, { status: 200 });
    }

    // All event handling is now done in the switch statement above.

    return NextResponse.json({
        success: false, message: `Webhook event type error ${event.type} not handled yet. Please contact support if you see this message.
    `}, { status: 200 });
}
