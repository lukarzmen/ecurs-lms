import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {

    const { userId, courseId, sessionId } = await req.json();
    if (!userId || !courseId || !sessionId) {
            return new NextResponse("Invalid courseId", {
              status: 400,
            });
    }

    try {
        const clerkUser = await clerkClient().users.getUser(userId);
        // Check if user exists, if not, create a new user
        let user = await db.user.findUnique({
            where: { providerId: userId },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not exists', exists: false });
        }

        // Add user to UserCourse table with state 1
        const userCourse = await db.userCourse.findUnique({
            where: {
            userId_courseId: {
                userId: user.id,
                courseId: Number(courseId),
            },
            },
        });

        if (userCourse) {
            if (userCourse.state === 1) {
            return NextResponse.json({ message: 'User already has permission', exists: true });
            }
            return NextResponse.json({ message: 'User has no permission to course. Ask teacher.', exists: false });
        }

        await db.userCourse.create({
            data: {
            userId: user.id,
            courseId: Number(courseId),
            state: 0,
            },
        });

        
        return NextResponse.json({ message: 'Permission added successfully', exists: false });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", {
            status: 500,
          });
    }
}