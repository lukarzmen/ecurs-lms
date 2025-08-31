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
    }
    catch (err) {
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

    // Handle payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata || {};
        const appUserId = metadata.userId;
        const courseId = metadata.courseId;
        const userCourseId = metadata.userCourseId;

        if (!appUserId || !courseId || !userCourseId) {
            console.error("Missing userId, courseId, or userCourseId in payment intent metadata");
            return new NextResponse("Missing metadata", { status: 400 });
        }

        // upsert user course
        await db.userCourse.upsert({
            where: {
                id: Number(userCourseId),
            },
            update: {
                state: 1,
            },
            create: {
                userId: Number(appUserId),
                courseId: Number(courseId),
                state: 1,
            },
        });
        // Insert purchase record
        await db.userCoursePurchase.create({
            data: {
                userCourseId: Number(userCourseId),
                paymentId: paymentIntent.id,
                purchaseDate: new Date(),
            }
        });
        return NextResponse.json({ success: true }, { status: 200 });
        }

        // Handle checkout.session.completed for subscriptions
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.mode === "subscription" && session.subscription) {
                const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
                    apiVersion: "2025-05-28.basil",
                });
                const metadata = await getSubscriptionMetadata(stripeClient, session.subscription as string);
                const appUserId = metadata.userId;
                const courseId = metadata.courseId;
                const userCourseId = metadata.userCourseId;
                if (!appUserId || !courseId || !userCourseId) {
                    console.error("Missing userId, courseId, or userCourseId in subscription metadata");
                    return new NextResponse("Missing metadata", { status: 400 });
                }
                // upsert user course
                await db.userCourse.upsert({
                    where: {
                        id: Number(userCourseId),
                    },
                    update: {
                        state: 1,
                    },
                    create: {
                        userId: Number(appUserId),
                        courseId: Number(courseId),
                        state: 1,
                    },
                });
                // Insert purchase record
                await db.userCoursePurchase.create({
                    data: {
                        userCourseId: Number(userCourseId),
                        paymentId: session.id,
                        purchaseDate: new Date(),
                    }
                });
                return NextResponse.json({ success: true }, { status: 200 });
            }
        }

        // Handle invoice.paid for recurring subscription payments
        if (event.type === "invoice.paid") {
            const invoice = event.data.object as Stripe.Invoice;
            const subscriptionId = (invoice as any)['subscription'];
            if (subscriptionId) {
                const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
                    apiVersion: "2025-05-28.basil",
                });
                const metadata = await getSubscriptionMetadata(stripeClient, subscriptionId as string);
                const appUserId = metadata.userId;
                const courseId = metadata.courseId;
                const userCourseId = metadata.userCourseId;
                if (!appUserId || !courseId || !userCourseId) {
                    console.error("Missing userId, courseId, or userCourseId in subscription metadata (invoice.paid)");
                    return new NextResponse("Missing metadata", { status: 400 });
                }
                // upsert user course
                await db.userCourse.upsert({
                    where: {
                        id: Number(userCourseId),
                    },
                    update: {
                        state: 1,
                    },
                    create: {
                        userId: Number(appUserId),
                        courseId: Number(courseId),
                        state: 1,
                    },
                });
                // Insert purchase record
                await db.userCoursePurchase.create({
                    data: {
                        userCourseId: Number(userCourseId),
                        paymentId: (invoice as any)['payment_intent'] as string,
                        purchaseDate: new Date(),
                    }
                });
                return NextResponse.json({ success: true }, { status: 200 });
            }
    }

    return NextResponse.json({
        success: false, message: `Webhook event type error ${event.type} not handled yet. Please contact support if you see this message.
    `}, { status: 200 });
}


