import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    try {
        const userId = searchParams.get("userId");

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { providerId: userId },
            select: { id: true, role: true },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Find userCourses by userId
        const userCourses = await db.userCourse.findMany({
            where: {
                courseId: {
                    in: await db.userCourse.findMany({
                        where: {
                            userId: user.id
                        },
                        select: {
                            courseId: true
                        }
                    }).then(userCourses => userCourses.map(userCourse => userCourse.courseId))
                }
            },
            include: {
                user: true
            }
        });

        // Extract unique users from userCourses
        const uniqueUsers = Array.from(
            new Map(userCourses.map(userCourse => [userCourse.user.id, userCourse.user])).values()
        ).sort((a, b) => a.firstName?.localeCompare(b.firstName || "") || 0);

        return NextResponse.json(uniqueUsers);
    } catch (error) {
        console.error('[GET_STUDENTS]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}