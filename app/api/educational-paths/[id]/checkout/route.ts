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
            userEducationalPath = await db.userEducationalPath.create({
                data: {
                    userId: user.id,
                    educationalPathId: Number(educationalPathId),
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    state: 1,
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

        // Check if teacher has completed Stripe onboarding
        if (!eduPath.author?.stripeAccountId || !eduPath.author?.stripeOnboardingComplete) {
            console.error(`Teacher payment account not configured for educational path ${educationalPathId}. StripeAccountId: ${eduPath.author?.stripeAccountId}, OnboardingComplete: ${eduPath.author?.stripeOnboardingComplete}`);
            return new NextResponse("Autor ścieżki edukacyjnej nie ma skonfigurowanego konta płatności. Płatność została anulowana.", { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify that the Stripe account is still active
        try {
            const teacherAccount = await stripeClient.accounts.retrieve(eduPath.author.stripeAccountId);
            if (!teacherAccount.charges_enabled || !teacherAccount.payouts_enabled) {
                console.error(`Teacher Stripe account ${eduPath.author.stripeAccountId} is not fully enabled. Charges: ${teacherAccount.charges_enabled}, Payouts: ${teacherAccount.payouts_enabled}`);
                return new NextResponse("Konto płatności autora ścieżki edukacyjnej nie jest aktywne. Płatność została anulowana.", { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (stripeError) {
            console.error(`Failed to verify teacher Stripe account ${eduPath.author.stripeAccountId}:`, stripeError);
            return new NextResponse("Nie można zweryfikować konta płatności autora. Płatność została anulowana.", { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        // Fetch price from EducationalPathPrice
        const price = await db.educationalPathPrice.findUnique({
            where: { educationalPathId: Number(educationalPathId) },
        });

        // Create or update UserCourse for all courses in the path
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
                            state: 1, // active
                        }
                    });
                } else if (userCourse.state !== 1) {
                    await db.userCourse.update({
                        where: {
                            userId_courseId: {
                                userId: user.id,
                                courseId: course.courseId,
                            }
                        },
                        data: {
                            state: 1,
                        }
                    });
                }
            }
        }

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
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    stripeCustomerId: stripeCustomerId,
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
                                name: eduPath.title,
                                description: "Ścieżka edukacyjna",
                                images: eduPath.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${eduPath.imageId}`] : [],
                            },
                            unit_amount: Math.round(finalPrice * 100),
                            recurring: {
                                interval: stripeRecurringInterval,
                            },
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?success=1`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?canceled=1`,
                client_reference_id: String(userEducationalPath.id),
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
                },
                subscription_data: {
                    trial_period_days: trialPeriodDays,
                    transfer_data: {
                        destination: eduPath.author.stripeAccountId,
                    },
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
                                name: eduPath.title,
                                description: "Ścieżka edukacyjna",
                                images: eduPath.imageId ? [`${process.env.NEXT_PUBLIC_APP_URL}/api/images/${eduPath.imageId}`] : [],
                            },
                            unit_amount: Math.round(finalPrice * 100),
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?success=1`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/educational-paths/${educationalPathId}?canceled=1`,
                client_reference_id: String(userEducationalPath.id),
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
                },
                payment_intent_data: {
                    transfer_data: {
                        destination: eduPath.author.stripeAccountId,
                    },
                    metadata: {
                        userEducationalPathId: userEducationalPath.id.toString(),
                        educationalPathId: educationalPathId,
                        userId: user.id,
                        email: email,
                        promoCode: promoCode,
                        discount: discount.toString(),
                        type: paymentType,
                        teacherAccountId: eduPath.author.stripeAccountId,
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