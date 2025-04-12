import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
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

        // Fetch user courses and calculate counts in a single query
        const courseAnalytics = await db.userCourse.aggregate({
            where: { userId: user.id },
            _count: {
                courseId: true,
                userId: true,
            },
        });

        const coursesCount = courseAnalytics._count.courseId;
        const userCount = courseAnalytics._count.userId;

        // Find the most popular course using a single database query
        const mostPopularCourseGroup = await db.userCourse.groupBy({
            by: ['courseId'],
            where: { userId: user.id },
            _count: {
                courseId: true,
            },
            orderBy: {
                _count: {
                    courseId: 'desc',
                },
            },
            take: 1,
        });

        let mostPopularCourseName = "No courses yet";
        if (mostPopularCourseGroup.length > 0) {
            const course = await db.course.findUnique({
                where: { id: mostPopularCourseGroup[0].courseId },
                select: { title: true },
            });
            mostPopularCourseName = course ? course.title : "No courses yet";
        }

        // Calculate new users last month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const newUsersLastMonth = await db.user.count({
            where: {
                createdAt: {
                    gte: lastMonth,
                },
            },
        });

        // Calculate new courses last month
        const newCoursesLastMonth = await db.course.count({
            where: {
                createdAt: {
                    gte: lastMonth,
                },
            },
        });

        // Find the least popular course
        const leastPopularCourseGroup = await db.userCourse.groupBy({
            by: ['courseId'],
            where: { userId: user.id },
            _count: {
                courseId: true,
            },
            orderBy: {
                _count: {
                    courseId: 'asc',
                },
            },
            take: 1,
        });

        let leastPopularCourseName = "No courses yet";
        if (leastPopularCourseGroup.length > 0) {
            const course = await db.course.findUnique({
                where: { id: leastPopularCourseGroup[0].courseId },
                select: { title: true },
            });
            leastPopularCourseName = course ? course.title : "No courses yet";
        }

        return NextResponse.json({
            userCount,
            coursesCount,
            mostPopularCourse: mostPopularCourseName,
            newUsersLastMonth,
            newCoursesLastMonth,
            leastPopularCourse: leastPopularCourseName,
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}