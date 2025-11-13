import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";


export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    let event: Stripe.Event;
    try {
        event = Stripe.webhooks.constructEvent(
            body,
            signature as string,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err) {
        console.error("Error constructing Stripe event:", err);
        return new NextResponse("Webhook Error", { status: 400 });
    }

    // Helper to fetch subscription metadata
    async function getSubscriptionMetadata(stripeClient: Stripe, subscriptionId: string) {
        try {
            const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
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
    async function createCoursePurchase(userCourseId: number, paymentId: string, eventData?: any) {
        const baseData: any = {
            userCourseId,
            paymentId,
            purchaseDate: new Date(),
        };

        // If eventData is provided, extract additional Stripe data
        if (eventData) {
            const stripeData = extractPaymentData(eventData, event.type);
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

        await db.userCoursePurchase.create({
            data: baseData,
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

        await db.userCoursePurchase.create({
            data: baseData,
        });
    }
    async function createEduPathPurchase(appUserId: number, educationalPathId: number, paymentId: string, eventData?: any) {
        const baseData: any = {
            userId: appUserId,
            educationalPathId,
            paymentId,
            purchaseDate: new Date(),
        };

        // If eventData is provided, extract additional Stripe data
        if (eventData) {
            const stripeData = extractPaymentData(eventData, event.type);
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

        await db.educationalPathPurchase.create({
            data: baseData,
        });
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

        await db.educationalPathPurchase.create({
            data: baseData,
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
                        return NextResponse.json({ success: false, error: "Missing educational path metadata" }, { status: 200 });
                    }
                    await upsertEduPath(userEducationalPathId, appUserId, educationalPathId, 1);
                    
                    // Create purchase record with detailed payment info
                    await createEduPathPurchase(appUserId, educationalPathId, paymentIntent.id, paymentIntent);
                    
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
                                const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-05-28.basil" });
                                const charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge as string);
                                const invoiceId = (charge as any).invoice as string | undefined;
                                if (invoiceId) {
                                    const invoice = await stripeClient.invoices.retrieve(invoiceId);
                                    const subscriptionId = (invoice as any).subscription as string | undefined;
                                    if (subscriptionId) {
                                        const subMeta = await getSubscriptionMetadata(stripeClient, subscriptionId);
                                        const sUserId = subMeta.userId;
                                        const sCourseId = subMeta.courseId;
                                        const sUserCourseId = subMeta.userCourseId;
                                        if (sUserId && sCourseId && sUserCourseId) {
                                            await upsertCourse(Number(sUserCourseId), Number(sUserId), Number(sCourseId), 1);
                                            await createCoursePurchase(Number(sUserCourseId), paymentIntent.id, paymentIntent);
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
                    await createCoursePurchase(Number(userCourseId), paymentIntent.id, paymentIntent);
                    
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
                        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-05-28.basil" });
                        const subscriptionMetadata = await getSubscriptionMetadata(stripeClient, session.subscription as string);
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
                    
                    await createEduPathPurchase(appUserId, educationalPathId, session.id, session);
                    return NextResponse.json({ success: true }, { status: 200 });
                } else {
                    // Course subscription logic
                    try {
                        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-05-28.basil" });
                        // Prefer subscription metadata; if missing, fallback to session.metadata
                        const subMeta = await getSubscriptionMetadata(stripeClient, session.subscription as string);
                        const sessMeta = (session.metadata || {}) as any;
                        const appUserId = (subMeta as any).userId || sessMeta.userId;
                        const courseId = (subMeta as any).courseId || sessMeta.courseId;
                        const userCourseId = (subMeta as any).userCourseId || sessMeta.userCourseId || session.client_reference_id;
                        if (!appUserId || !courseId || !userCourseId) {
                            logError("CHECKOUT_COMPLETED_MISSING_META", { eventId: event.id, sessionId: session.id, subMeta, sessMeta });
                            return new NextResponse("Missing metadata", { status: 400 });
                        }
                        await upsertCourse(Number(userCourseId), Number(appUserId), Number(courseId), 1);
                        // Try to attach metadata to the initial PaymentIntent via latest invoice for better traceability
                        try {
                            const subscription = await stripeClient.subscriptions.retrieve(session.subscription as string, {
                                expand: ["latest_invoice.payment_intent"],
                            });
                            const latestInvoiceAny = (subscription as any).latest_invoice as any;
                            const piObjOrId = latestInvoiceAny && latestInvoiceAny.payment_intent;
                            const piId = typeof piObjOrId === "string" ? piObjOrId : piObjOrId?.id;
                            if (piId) {
                                await stripeClient.paymentIntents.update(piId, {
                                    metadata: {
                                        userCourseId: String(userCourseId),
                                        courseId: String(courseId),
                                        userId: String(appUserId),
                                        mode: "subscription",
                                    }
                                });
                            }
                        } catch (err) {
                            logError("CHECKOUT_COMPLETED_PI_META_UPDATE_FAIL", { eventId: event.id, sessionId: session.id, error: String(err) });
                        }
                        await createCoursePurchase(Number(userCourseId), session.id, session);
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
            const subscriptionId = (invoice as any)['subscription'];
            
            // Log detailed invoice information
            logEventData("INVOICE_PAID", invoice, {
                amountFormatted: invoice.total ? `${(invoice.total / 100).toFixed(2)} ${invoice.currency?.toUpperCase()}` : 'N/A',
                customerEmail: invoice.customer_email,
                subscriptionId: subscriptionId,
                invoiceNumber: invoice.number,
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
                periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
                periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            });
            
            if (subscriptionId) {
                const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-05-28.basil" });
                const metadata = await getSubscriptionMetadata(stripeClient, subscriptionId as string);
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
                    
                    await createEduPathPurchase(appUserId, educationalPathId, (invoice as any)['payment_intent'] as string, invoice);
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
                    await createCoursePurchase(Number(userCourseId), (invoice as any)['payment_intent'] as string, invoice);
                    return NextResponse.json({ success: true }, { status: 200 });
                }
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
                const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-05-28.basil" });
                const metadata = await getSubscriptionMetadata(stripeClient, subscriptionId as string);
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
                                const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-05-28.basil" });
                                const charge = await stripeClient.charges.retrieve(paymentIntent.latest_charge as string);
                                const invoiceId = (charge as any).invoice as string | undefined;
                                if (invoiceId) {
                                    const invoice = await stripeClient.invoices.retrieve(invoiceId);
                                    const subscriptionId = (invoice as any).subscription as string | undefined;
                                    if (subscriptionId) {
                                        const subMeta = await getSubscriptionMetadata(stripeClient, subscriptionId);
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
