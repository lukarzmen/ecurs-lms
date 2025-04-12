import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clerkClient } from '@clerk/nextjs/server';

export interface UserResponse {
  exists: boolean;
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  providerId: string;
  roleId: number;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    
    if (!userId || !sessionId) {
        return new NextResponse("Invalid parameters", {
            status: 400,
        });
    }

    try {
        const user = await db.user.findUnique({
            where: { providerId: userId },
            select: {
                id: true,
                providerId: true,
                email: true,
                firstName: true,
                lastName: true,
                displayName: true,
                roleId: true,
            },
        });

        if (!user) {
            return NextResponse.json({ exists: false });
        }

        const userResponse: UserResponse = {
            exists: true,
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            displayName: user.displayName ?? '',
            providerId: user.providerId,
            roleId: user.roleId
        };
        
        return NextResponse.json(userResponse);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}

export async function POST(req: Request) {
    const { userId, sessionId, roleId } = await req.json();
    if (!userId || !sessionId) {
        return new NextResponse("Invalid parameters", {
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
                    roleId: roleId,
                    displayName: `${clerkUser.firstName} ${clerkUser.lastName}`,
                },
            });
            return NextResponse.json({ created: true, user });
        }
        
        return NextResponse.json({ created: false, exists: true, user });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}