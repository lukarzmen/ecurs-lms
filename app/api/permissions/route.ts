import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Check permission
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url!);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId || !courseId) {
        return new NextResponse("Invalid courseId or userId", { status: 400 });
    }

    try {
        const user = await db.user.findUnique({
            where: { providerId: userId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const userCourse = await db.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: Number(courseId),
                },
            },
        });
        if(!userCourse) {
            return NextResponse.json({ exists: false, hasAccess: false });
        }
        if (userCourse && userCourse.state === 1) {
            return NextResponse.json({ exists: true, hasAccess: true });
        }
        return NextResponse.json({ exists: true, hasAccess: false });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// POST: Create userCourse with state 0
export async function POST(req: Request) {
    const { userId, courseId } = await req.json();
    if (!userId || !courseId) {
        return new NextResponse("Invalid courseId or userId", { status: 400 });
    }

    try {
        const user = await db.user.findUnique({
            where: { providerId: userId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Check if already exists
        const userCourse = await db.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: Number(courseId),
                },
            },
        });

        if (userCourse) {
            return NextResponse.json({ created: false, message: "UserCourse already exists" });
        }

        await db.userCourse.create({
            data: {
                userId: user.id,
                courseId: Number(courseId),
                state: 0,
            },
        });

        return NextResponse.json({ created: true });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", { status: 500 });
    }
}