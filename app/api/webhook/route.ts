import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";


export async function POST(req: Request) {
    const { userId } = await auth();
    if(!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
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
    const session = event.data.object as Stripe.Checkout.Session;
    const appUserId = session.metadata?.userId;
    const courseId = session.metadata?.courseId;
    const userCourseId = session.metadata?.userCourseId;
    if (event.type === "checkout.session.completed") {
        if (!appUserId || !courseId || !userCourseId) {
            console.error("Missing userId or courseId in session metadata");
            return new NextResponse("Missing metadata", { status: 400 });
        }
        // Insert purchase record
        await db.userCoursePurchase.create({
            data: {
                userCourseId: Number(userCourseId),
                paymentId: session.payment_intent as string ?? session.id,
                purchaseDate: new Date(),
            }
        });
        return NextResponse.json({ success: true }, { status: 200 });
    }
    return NextResponse.json({
        success: false, message: `Webhook event type error ${event.type} not handled yet. Please contact support if you see this message.
    `}, { status: 200 });
}


