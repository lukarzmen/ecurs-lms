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

    return NextResponse.json({
        success: false, message: `Webhook event type error ${event.type} not handled yet. Please contact support if you see this message.
    `}, { status: 200 });
}


