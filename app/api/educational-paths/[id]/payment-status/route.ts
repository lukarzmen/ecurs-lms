import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

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
            // Find existing userEducationalPath and set state to 0
            const userEducationalPath = await db.userEducationalPath.findUnique({
                where: {
                    userId_educationalPathId: {
                        userId: user.id,
                        educationalPathId: Number(educationalPathId),
                    }
                }
            });

            if (userEducationalPath) {
                await db.userEducationalPath.update({
                    where: { id: userEducationalPath.id },
                    data: { 
                        state: 0,
                        updatedAt: new Date()
                    }
                });
            } else {
                // Create new userEducationalPath with state 0 if it doesn't exist
                await db.userEducationalPath.create({
                    data: {
                        userId: user.id,
                        educationalPathId: Number(educationalPathId),
                        state: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }
                });
            }

            // Also set all related userCourse states to 0
            const eduPath = await db.educationalPath.findUnique({
                where: { id: Number(educationalPathId) },
                include: {
                    courses: {
                        select: { courseId: true }
                    }
                }
            });

            if (eduPath?.courses) {
                for (const course of eduPath.courses) {
                    const userCourse = await db.userCourse.findUnique({
                        where: {
                            userId_courseId: {
                                userId: user.id,
                                courseId: course.courseId,
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
                    }
                }
            }

            return NextResponse.json({ 
                success: true, 
                message: "Payment status updated",
                state: 0 
            });
        }

        // Handle successful payment (this should normally be handled by webhooks)
        if (status === 'success') {
            const userEducationalPath = await db.userEducationalPath.findUnique({
                where: {
                    userId_educationalPathId: {
                        userId: user.id,
                        educationalPathId: Number(educationalPathId),
                    }
                }
            });

            if (userEducationalPath && userEducationalPath.state === 0) {
                // Only update if current state is 0 (unpaid)
                // Don't override webhook processing if already set to 1
                await db.userEducationalPath.update({
                    where: { id: userEducationalPath.id },
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
        console.error("[EDUCATIONAL_PATH_PAYMENT_STATUS_UPDATE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}