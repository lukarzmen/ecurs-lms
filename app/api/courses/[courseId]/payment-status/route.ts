import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

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
        const { status } = body; // 'success' | 'canceled' | 'failed'

        const currentAuthUser = await currentUser();
        const email = currentAuthUser?.emailAddresses[0]?.emailAddress;
        
        if (!email) {
            return new NextResponse("User email not found", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { email: email }
        });
        
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Handle payment failure or cancellation
        if (status === 'canceled' || status === 'failed') {
            // Find existing userCourse and set state to 0
            const userCourse = await db.userCourse.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: Number(courseId),
                    }
                }
            });

            if (userCourse) {
                await db.userCourse.update({
                    where: { id: userCourse.id },
                    data: { 
                        state: 0,
                        updatedAt: new Date()
                    }
                });
            } else {
                // Create new userCourse with state 0 if it doesn't exist
                await db.userCourse.create({
                    data: {
                        userId: user.id,
                        courseId: Number(courseId),
                        state: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }
                });
            }

            return NextResponse.json({ 
                success: true, 
                message: "Payment status updated",
                state: 0 
            });
        }

        // Handle successful payment (this should normally be handled by webhooks)
        if (status === 'success') {
            const userCourse = await db.userCourse.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: Number(courseId),
                    }
                }
            });

            if (userCourse && userCourse.state === 0) {
                // Only update if current state is 0 (unpaid)
                // Don't override webhook processing if already set to 1
                await db.userCourse.update({
                    where: { id: userCourse.id },
                    data: { 
                        state: 1,
                        updatedAt: new Date()
                    }
                });
            }

            return NextResponse.json({ 
                success: true, 
                message: "Payment success confirmed",
                state: 1 
            });
        }

        return new NextResponse("Invalid status", { status: 400 });
        
    } catch (error) {
        console.error("[PAYMENT_STATUS_UPDATE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}