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
    const { userId, sessionId, roleId, businessData } = await req.json();
    if (!userId || !sessionId) {
        return new NextResponse("Invalid parameters", {
            status: 400,
        });
    }

    try {
        console.log('Attempting to fetch user from Clerk with ID:', userId);
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        console.log('Successfully fetched user from Clerk:', clerkUser.id);
        const emails = clerkUser.emailAddresses.map((e: any) => e.emailAddress);

        let user = await db.user.findFirst({
            where: {
                OR: emails.map((email: string) => ({ email })),
            },
        });

        // Prepare business type data for user creation/update
        const businessTypeData = businessData ? {
            businessType: businessData.businessType || "individual",
            companyName: businessData.businessType === "company" ? businessData.companyName : null,
            taxId: businessData.businessType === "company" ? businessData.taxId : null,
            requiresVatInvoices: businessData.businessType === "company" ? (businessData.requiresVatInvoices || false) : false,
        } : {
            businessType: "individual",
            companyName: null,
            taxId: null,
            requiresVatInvoices: false,
        };

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
                    ...businessTypeData,
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
            // User exists - update only providerId, role, and business data if provided
            const updateData: any = {
                providerId: userId,
                roleId: roleId,
                updatedAt: new Date(),
            };

            // Update business data if provided
            if (businessData) {
                updateData.businessType = businessData.businessType || "individual";
                updateData.companyName = businessData.businessType === "company" ? businessData.companyName : null;
                updateData.taxId = businessData.businessType === "company" ? businessData.taxId : null;
                updateData.requiresVatInvoices = businessData.businessType === "company" ? (businessData.requiresVatInvoices || false) : false;
            }

            user = await db.user.update({
                where: { id: user.id },
                data: updateData,
            });
            
            // If teacher role and no Stripe account, indicate onboarding needed
            if (roleId === 1 && (!user.stripeAccountId || !user.stripeOnboardingComplete)) {
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
        console.error('POST /api/user error:', error);
        
        // Handle Clerk-specific errors
        if (error && typeof error === 'object' && 'clerkError' in error) {
            console.error('Clerk error details:', {
                status: (error as any).status,
                clerkTraceId: (error as any).clerkTraceId,
                errors: (error as any).errors
            });
            return new NextResponse("User not found or access denied", {
                status: 404,
            });
        }
        
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