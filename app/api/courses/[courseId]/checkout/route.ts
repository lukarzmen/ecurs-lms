import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { use } from "react";
import Stripe from "stripe";

export async function POST(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const courseId = params.courseId;
        if (!courseId) {
            return new NextResponse("Course Id is required", { status: 400 });
        }

        const body = await req.json();
        const promoCode = body.promoCode || "";

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

        const userCourse = await db.userCourse.create({
            data: {
                userId: user.id,
                courseId: Number(courseId),
                state: 0,
            }
        });

        const course = await db.course.findUnique({
            where: { id: Number(courseId) },
            select: {
                title: true,
                imageId: true,
                price: true,
            }
        });
        if (!course) {
            console.error("Course not found for courseId:", courseId);
            return new NextResponse("Course not found", { status: 404 });
        }
        const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
            apiVersion: "2025-05-28.basil",
        });

        let stripeCustomerId = user.stripeCustomers[0]?.stripeCustomerId || null;
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
                    userId: user.id,
                },
            });
        }

        // Calculate price with promo code
        let finalPrice = Number(course.price);
        let discount = 0;
        if (promoCode) {
            // Find promo code for this course
            const promo = await db.promoCode.findFirst({
                where: {
                    courseId: Number(courseId),
                    code: promoCode,
                },
                select: { discount: true }
            });
            if (promo && typeof promo.discount === "number" && promo.discount > 0) {
                discount = promo.discount;
                finalPrice = finalPrice * (1 - discount / 100);
            }
        }

        const session = await stripeClient.checkout.sessions.create({
            mode: "payment",
            customer: stripeCustomerId!,
            line_items: [
                {
                    price_data: {
                        currency: "pln",
                        product_data: {
                            name: course.title,
                            description: "Kurs online",
                            images: course.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${course.imageId}`] : [],
                        },
                        unit_amount: Math.round(finalPrice * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?success=1`,
            cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?canceled=1`,
            payment_intent_data: {
                metadata: {
                    userCourseId: userCourse.id.toString(),
                    courseId: courseId,
                    userId: user.id,
                    email: email,
                    promoCode: promoCode,
                    discount: discount.toString(),
                }
            },
        });
        return NextResponse.json({ message: "Checkout session created successfully", sessionUrl: session.url });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}