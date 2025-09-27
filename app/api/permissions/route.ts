import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    const { userId, courseId } = await req.json();
    if (!userId || !courseId) {
        return new NextResponse("Invalid courseId", {
            status: 400,
        });
    }

    try {
        // Check if user exists, if not, create a new user
        let user = await db.user.findUnique({
            where: { providerId: userId },
        });

        if (!user) {
            return new NextResponse("User not found", {
                status: 404,
            });
        }
        // Get course to check price
        const course = await db.course.findUnique({
            where: { id: Number(courseId) },
            select: { price: true, mode: true }
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }
        // Add user to UserCourse table with state 1
        const userCourse = await db.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: Number(courseId),
                },
            },
            include: { purchase: true }
        });
        const isFreeCourse = Number(course.price?.amount) === 0;
        const hasPurchase = !!userCourse?.purchase;
        console.log(userCourse, "User course data:", userCourse);
        if (userCourse) {
            if(userCourse.purchase){
                return NextResponse.json({ hasAccess: true, hasPurchase });
            }
            return NextResponse.json({ hasAccess: userCourse.state === 1, hasPurchase: hasPurchase || isFreeCourse });
        }
       
        const isPublic = course.mode === 1;
        const isPublicAndFree = (isPublic && isFreeCourse) ? 1 : 0;
        console.log("User ID:", user.id, "Course ID:", courseId, "Is public:", isPublic, "Is free course:", isFreeCourse, "User has access:", isPublicAndFree);
        if(isPublicAndFree){
            await db.userCourse.upsert({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: Number(courseId),
                    },
                },
                update: {
                    state: 1,
                },
                create: {
                    userId: user.id,
                    courseId: Number(courseId),
                    state: 1,
                },
            });
        }

        return NextResponse.json({ hasAccess: false, hasPurchase: true });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");

    if (!userId || !courseId) {
        return new NextResponse("Invalid courseId", {
            status: 400,
        });
    }

    try {
        const user = await db.user.findUnique({
            where: { providerId: userId },
        });

        if (!user) {
            return new NextResponse("User not found", {
                status: 404,
            });
        }

        const course = await db.course.findUnique({
            where: { id: Number(courseId) },
            select: { price: true, authorId: true }
        });

        if (!course) {
            console.error("Course not found for ID:", courseId);
            return new NextResponse("Course not found", { status: 404 });
        }

        // If user is the author, always allow access
        if (user.id === course.authorId) {
            console.log("User is the author of the course, granting access.");
            return NextResponse.json({ hasAccess: true, hasPurchase: true });
        }

        // If course is free, always allow access
        if (Number(course.price) === 0) {
            console.log("Course is free, granting access.");
            return NextResponse.json({ hasAccess: true, hasPurchase: true });
        }

        // Check if user has purchased the course
        const userCourse = await db.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: Number(courseId),
                },
            },
            include: { purchase: true }
        });
        console.log("User course data:", userCourse);
        const hasPurchase = !!userCourse?.purchase;

        if (userCourse && userCourse.state === 1) {
            console.log("User has access to the course.");
            return NextResponse.json({ hasAccess: true, hasPurchase });
        }

        return NextResponse.json({ hasAccess: false, hasPurchase });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}