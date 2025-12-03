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
  stripeAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  hasActiveSubscription?: boolean;
  businessType?: string | null;
  schoolId?: number | null;
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
                businessType: true,
                stripeAccountId: true,
                stripeOnboardingComplete: true,
                teacherPlatformSubscription: {
                    select: {
                        subscriptionStatus: true,
                    },
                },
                ownedSchools: {
                    select: {
                        id: true,
                    },
                    take: 1,
                },
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
            roleId: user.roleId,
            businessType: user.businessType,
            stripeAccountId: user.stripeAccountId,
            stripeOnboardingComplete: user.stripeOnboardingComplete ?? false,
            hasActiveSubscription: user.teacherPlatformSubscription?.subscriptionStatus === 'active',
            schoolId: user.ownedSchools?.[0]?.id ?? null,
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
            
            // If teacher creating own school, create the school record
            let schoolId = null;
            if (roleId === 1 && businessData?.joinSchoolMode === "own-school" && businessData?.businessType === "company") {
                console.log('[POST /api/user] Creating school for teacher:', {
                    schoolName: businessData.schoolName,
                    companyName: businessData.companyName,
                    taxId: businessData.taxId,
                    ownerId: user.id
                });
                
                try {
                    const school = await db.school.create({
                        data: {
                            name: businessData.schoolName || "New School",
                            companyName: businessData.companyName || "",
                            taxId: businessData.taxId || "",
                            description: "",
                            ownerId: user.id,
                            stripeAccountId: null,
                            stripeAccountStatus: "pending",
                            stripeOnboardingComplete: false,
                        }
                    });
                    schoolId = school.id;
                    console.log('[POST /api/user] School created successfully:', schoolId);
                } catch (schoolError) {
                    console.error('[POST /api/user] Error creating school:', schoolError);
                    // Don't fail the entire request, but log the error
                }
            }
            
            // If teacher role, include stripe account setup info
            if (roleId === 1) {
                return NextResponse.json({ 
                    created: true, 
                    user,
                    schoolId,
                    needsStripeOnboarding: true 
                });
            }
            
            return NextResponse.json({ created: true, user, schoolId });
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
            
            // If teacher creating own school, create the school record
            let schoolId = null;
            if (roleId === 1 && businessData?.joinSchoolMode === "own-school" && businessData?.businessType === "company") {
                console.log('[POST /api/user] Creating school for existing teacher:', {
                    schoolName: businessData.schoolName,
                    companyName: businessData.companyName,
                    taxId: businessData.taxId,
                    ownerId: user.id
                });
                
                try {
                    const school = await db.school.create({
                        data: {
                            name: businessData.schoolName || "New School",
                            companyName: businessData.companyName || "",
                            taxId: businessData.taxId || "",
                            description: "",
                            ownerId: user.id,
                            stripeAccountId: null,
                            stripeAccountStatus: "pending",
                            stripeOnboardingComplete: false,
                        }
                    });
                    schoolId = school.id;
                    console.log('[POST /api/user] School created successfully:', schoolId);
                } catch (schoolError) {
                    console.error('[POST /api/user] Error creating school:', schoolError);
                    // Don't fail the entire request, but log the error
                }
            }
            
            // If teacher role and no Stripe account, indicate onboarding needed
            if (roleId === 1 && (!user.stripeAccountId || !user.stripeOnboardingComplete)) {
                return NextResponse.json({ 
                    created: false, 
                    updated: true, 
                    user,
                    schoolId,
                    needsStripeOnboarding: true 
                });
            }
            
            return NextResponse.json({ created: false, updated: true, user, schoolId });
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