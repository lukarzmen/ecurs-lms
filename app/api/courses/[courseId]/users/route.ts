import { db } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { courseId: string } }) {
    try {
        const { courseId } = params;

        if (!courseId) {
            return new NextResponse("Course ID is required", { status: 400 });
        }

        const course = await db.course.findUnique({
            where: {
                id: Number(courseId),
            },
            include: {
                userCourses: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        const users = await Promise.all(course.userCourses.map(async (userCourse) => {
            const user = await db.user.findUnique({
            where: {
                id: userCourse.userId,
            },
            include: {
                role: true,
            },
            });

            return {
            ...user,
            roleName: user?.role?.name || "No Role",
            };
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.log("[COURSE_ID_USERS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
