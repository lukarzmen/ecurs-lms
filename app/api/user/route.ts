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
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const emails = clerkUser.emailAddresses.map((e: any) => e.emailAddress);

        let user = await db.user.findFirst({
            where: {
                OR: emails.map((email: string) => ({ email })),
            },
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
                    displayName: `${clerkUser.username}` || `${clerkUser.firstName} ${clerkUser.lastName}`,
                },
            });
            
            // If teacher role, include stripe account setup info
            if (roleId === 1) {
                return NextResponse.json({ 
                    created: true, 
                    user,
                    needsStripeOnboarding: true 
                });
            }
            
            return NextResponse.json({ created: true, user });
        } else {
            // Update providerId and role if user exists
            user = await db.user.update({
                where: { id: user.id },
                data: {
                    providerId: userId,
                    roleId: roleId,
                    updatedAt: new Date(),
                },
            });
            
            // If teacher role and no Stripe account, indicate onboarding needed
            if (roleId === 1 && !user.stripeAccountId) {
                return NextResponse.json({ 
                    created: false, 
                    updated: true, 
                    user,
                    needsStripeOnboarding: true 
                });
            }
            
            return NextResponse.json({ created: false, updated: true, user });
        }
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}

export async function PATCH(req: Request) {
    const { userId, stripeAccountId, stripeAccountStatus } = await req.json();
    
    if (!userId || !stripeAccountId) {
        return new NextResponse("Invalid parameters", {
            status: 400,
        });
    }

    try {
        const user = await db.user.findUnique({
            where: { providerId: userId }
        });

        if (!user) {
            return new NextResponse("User not found", {
                status: 404,
            });
        }

        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: {
                stripeAccountId: stripeAccountId,
                stripeAccountStatus: stripeAccountStatus || 'created',
                stripeOnboardingComplete: false,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ 
            updated: true, 
            user: updatedUser 
        });
    } catch (error) {
        console.error("Error updating user with Stripe account:", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}