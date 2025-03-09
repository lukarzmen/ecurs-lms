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
            user = await db.user.create({
                data: {
                    providerId: userId,
                    email: clerkUser.emailAddresses[0].emailAddress, 
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    displayName: `${clerkUser.firstName} ${clerkUser.lastName}`,
                },
            });
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
            return NextResponse.json({ message: 'User already has permission', exists: true });
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