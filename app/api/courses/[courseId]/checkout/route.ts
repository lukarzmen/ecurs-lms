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
            userCourse = await db.userCourse.create({
                data: {
                    userId: user.id,
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    courseId: Number(courseId),
                    state: 0,
                }
            });
        }

        const course = await db.course.findUnique({
            where: { id: Number(courseId) },
            select: {
                title: true,
                imageId: true,
                price: {
                    select: {
                        amount: true,
                        currency: true,
                        isRecurring: true,
                        interval: true,
                        trialPeriodDays: true,
                        trialPeriodEnd: true,
                        trialPeriodType: true
                    }
                },
            }
        });
        const price = course?.price;
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
            session = await stripeClient.checkout.sessions.create({
                mode: "subscription",
                customer: stripeCustomerId!,
                line_items: [
                    {
                        price_data: {
                            currency: currency.toLowerCase(),
                            product_data: {
                                name: course.title,
                                description: "Kurs online",
                                images: course.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${course.imageId}`] : [],
                            },
                            unit_amount: Math.round(finalPrice * 100),
                            recurring: {
                                interval: stripeRecurringInterval,
                            },
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?success=1`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}?canceled=1`,
                client_reference_id: String(userCourse.id),
                metadata: {
                    userCourseId: userCourse.id.toString(),
                    courseId: courseId,
                    userId: String(user.id),
                    email: email,
                    promoCode: promoCode,
                    discount: discount.toString(),
                    mode: "subscription",
                    type: paymentType,
                },
                subscription_data: {
                    trial_period_days: trialPeriodDays,
                    metadata: {
                        userCourseId: userCourse.id.toString(),
                        courseId: courseId,
                        userId: user.id,
                        email: email,
                        promoCode: promoCode,
                        discount: discount.toString(),
                        mode: "subscription",
                        type: paymentType,
                    }
                },
            });
        } else {
            // One-time payment
            session = await stripeClient.checkout.sessions.create({
                mode: "payment",
                customer: stripeCustomerId!,
                line_items: [
                    {
                        price_data: {
                            currency: currency.toLowerCase(),
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
                client_reference_id: String(userCourse.id),
                metadata: {
                    userCourseId: userCourse.id.toString(),
                    courseId: courseId,
                    userId: String(user.id),
                    email: email,
                    promoCode: promoCode,
                    discount: discount.toString(),
                    mode: "payment",
                    type: paymentType,
                },
                payment_intent_data: {
                    metadata: {
                        userCourseId: userCourse.id.toString(),
                        courseId: courseId,
                        userId: user.id,
                        email: email,
                        promoCode: promoCode,
                        discount: discount.toString(),
                        type: paymentType,
                    }
                },
            });
        }
        return NextResponse.json({ message: "Checkout session created successfully", sessionUrl: session.url });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}