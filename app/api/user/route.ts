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
  hasActiveSubscription?: boolean;
  schoolId?: number | null;
  schoolStripeOnboardingComplete?: boolean;
  school?: {
    id: number;
    name: string;
    companyName: string;
    taxId: string;
    schoolType: string;
    requiresVatInvoices: boolean;
  } | null;
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
        // First try to find user by providerId (current login method)
        let user = await db.user.findUnique({
            where: { providerId: userId },
            select: {
                id: true,
                providerId: true,
                email: true,
                firstName: true,
                lastName: true,
                displayName: true,
                roleId: true,
                teacherPlatformSubscription: {
                    select: {
                        subscriptionStatus: true,
                    },
                },
                ownedSchools: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                        taxId: true,
                        schoolType: true,
                        requiresVatInvoices: true,
                        stripeOnboardingComplete: true,
                    },
                    take: 1,
                },
            },
        });

        if (!user) {
            return NextResponse.json({ exists: false });
        }

        // Get school - first check owned schools
        let school = user.ownedSchools?.[0] ? {
            id: user.ownedSchools[0].id,
            name: user.ownedSchools[0].name,
            companyName: user.ownedSchools[0].companyName,
            taxId: user.ownedSchools[0].taxId,
            schoolType: user.ownedSchools[0].schoolType,
            requiresVatInvoices: user.ownedSchools[0].requiresVatInvoices,
        } : null;

        // If no owned school, check memberships separately to avoid Prisma errors
        let memberSchool = null;
        if (!school) {
            const membership = await db.schoolTeacher.findFirst({
                where: {
                    teacherId: user.id,
                },
                select: {
                    school: {
                        select: {
                            id: true,
                            name: true,
                            companyName: true,
                            taxId: true,
                            schoolType: true,
                            requiresVatInvoices: true,
                            stripeOnboardingComplete: true,
                        }
                    }
                },
                take: 1
            });
            
            if (membership?.school) {
                memberSchool = membership.school;
                school = {
                    id: memberSchool.id,
                    name: memberSchool.name,
                    companyName: memberSchool.companyName,
                    taxId: memberSchool.taxId,
                    schoolType: memberSchool.schoolType,
                    requiresVatInvoices: memberSchool.requiresVatInvoices,
                };
            }
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
            hasActiveSubscription: user.teacherPlatformSubscription?.subscriptionStatus === 'active',
            schoolId: user.ownedSchools?.[0]?.id ?? memberSchool?.id ?? null,
            schoolStripeOnboardingComplete: user.ownedSchools?.[0]?.stripeOnboardingComplete ?? memberSchool?.stripeOnboardingComplete ?? false,
            school,
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

        // Prepare business type data for school (removed from user)
        // Note: After migration, teachers should have schools created. This logic is for edge cases.
        // companyName and taxId are required fields in School schema and must never be null
        const businessTypeData = businessData ? {
            businessType: businessData.businessType || "individual",
            companyName: businessData.businessType === "company" ? (businessData.companyName || "") : "",
            taxId: businessData.businessType === "company" ? (businessData.taxId || "") : (businessData.taxId || ""),
        } : {
            businessType: "individual",
            companyName: "",
            taxId: "",
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
                },
            });
            
            // If teacher role, find or create their personal school
            let schoolId = null;
            if (roleId === 1) {
                // Check if teacher wants to join an existing school instead of owning one
                if (businessData?.businessType === "join-school" && businessData?.selectedSchoolId) {
                    // Teacher wants to join existing school, don't create a new one
                    schoolId = businessData.selectedSchoolId;
                    console.log('[POST /api/user] Teacher wants to join existing school:', schoolId);
                    
                    // Create join request instead of making them a direct member
                    try {
                        const existingRequest = await db.teacherJoinRequest.findUnique({
                            where: {
                                teacherId_schoolId: {
                                    teacherId: user.id,
                                    schoolId: schoolId,
                                },
                            },
                        });
                        
                        if (!existingRequest) {
                            const joinRequest = await db.teacherJoinRequest.create({
                                data: {
                                    teacherId: user.id,
                                    schoolId: schoolId,
                                },
                            });
                            console.log('[POST /api/user] Join request created:', joinRequest.id);
                        } else {
                            console.log('[POST /api/user] Join request already exists');
                        }
                    } catch (joinError) {
                        console.error('[POST /api/user] Error creating join request:', joinError);
                    }
                } else {
                    // Check if teacher already has a school from migration
                    const existingSchool = await db.school.findFirst({
                        where: { ownerId: user.id },
                        select: { id: true }
                    });
                    
                    if (existingSchool) {
                        schoolId = existingSchool.id;
                        console.log('[POST /api/user] Found existing school for teacher:', schoolId);
                    } else {
                        // Create school for teacher if migration didn't happen
                        console.log('[POST /api/user] Creating school for teacher:', user.id);
                        
                        try {
                            const school = await db.school.create({
                                data: {
                                    name: businessData?.schoolName || `${user.firstName} ${user.lastName}`.trim() || "Personal School",
                                    companyName: businessTypeData.companyName || user.displayName || "",
                                    taxId: businessTypeData.taxId || "",
                                    description: "",
                                    ownerId: user.id,
                                    stripeAccountId: null,
                                    stripeOnboardingComplete: false,
                                    requiresVatInvoices: businessData?.requiresVatInvoices || false,
                                    schoolType: businessData?.businessType === "company" ? "business" : "individual",
                                }
                            });
                            schoolId = school.id;
                            console.log('[POST /api/user] School created successfully:', schoolId);
                            
                            // Add teacher to their own school as member
                            try {
                                await db.schoolTeacher.create({
                                    data: {
                                        schoolId: schoolId,
                                        teacherId: user.id,
                                        role: "owner" // Ustawiamy jako właściciela
                                    }
                                });
                                console.log('[POST /api/user] Teacher added to their school as owner');
                            } catch (memberError) {
                                console.error('[POST /api/user] Error adding teacher to school:', memberError);
                            }
                        } catch (schoolError) {
                            console.error('[POST /api/user] Error creating school:', schoolError);
                        }
                    }
                }
            }
            
            // If teacher role, indicate onboarding needed
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
            // User exists - update providerId, roleId and business data if needed
            console.log('[POST /api/user] User already exists, will update data...');
            
            // Check if user has all required fields for profile to be considered complete
            const hasCompleteProfile = !!(
              user.email &&
              user.firstName &&
              user.lastName &&
              user.roleId !== null
            );

            if (!hasCompleteProfile) {
              console.log('[POST /api/user] User profile is incomplete, will complete it');
              // Profile is incomplete - allow to update everything including fields
            }
            
            const updateData: any = {
              providerId: userId, // Always update to current provider
              roleId: roleId,
              updatedAt: new Date(),
            };
            
            user = await db.user.update({
                where: { id: user.id },
                data: updateData,
            });
            
            // If teacher role, find or create their school
            let schoolId = null;
            if (roleId === 1) {
                // Check if teacher has a school
                const existingSchool = await db.school.findFirst({
                    where: { ownerId: user.id },
                    select: { id: true }
                });
                
                if (existingSchool) {
                    schoolId = existingSchool.id;
                    console.log('[POST /api/user] Found existing school for existing teacher:', schoolId);
                    
                    // Update school business data if provided
                    if (businessData && businessData.businessType === "company") {
                        try {
                            await db.school.update({
                                where: { id: schoolId },
                                data: {
                                    companyName: businessData.companyName || "",
                                    taxId: businessData.taxId || "",
                                }
                            });
                            console.log('[POST /api/user] Updated school business data');
                        } catch (updateError) {
                            console.error('[POST /api/user] Error updating school:', updateError);
                        }
                    }
                } else {
                    // Create school if missing
                    console.log('[POST /api/user] Creating missing school for existing teacher:', user.id);
                    
                    try {
                        const school = await db.school.create({
                            data: {
                                name: businessData?.schoolName || `${user.firstName} ${user.lastName}`.trim() || "Personal School",
                                companyName: businessData?.businessType === "company" ? businessData.companyName : user.displayName || "",
                                taxId: businessData?.businessType === "company" ? businessData.taxId : (businessData?.taxId || ""),
                                description: "",
                                ownerId: user.id,
                                stripeAccountId: null,
                                stripeOnboardingComplete: false,
                                requiresVatInvoices: businessData?.requiresVatInvoices || false,
                                schoolType: businessData?.businessType === "company" ? "business" : "individual",
                            }
                        });
                        schoolId = school.id;
                        console.log('[POST /api/user] School created successfully:', schoolId);
                        
                        // Add teacher to their own school as member
                        try {
                            await db.schoolTeacher.create({
                                data: {
                                    schoolId: schoolId,
                                    teacherId: user.id,
                                    role: "owner" // Ustawiamy jako właściciela
                                }
                            });
                            console.log('[POST /api/user] Teacher added to their school as owner');
                        } catch (memberError) {
                            console.error('[POST /api/user] Error adding teacher to school:', memberError);
                        }
                    } catch (schoolError) {
                        console.error('[POST /api/user] Error creating school:', schoolError);
                    }
                }
            }
            
            return NextResponse.json({ user, schoolId });
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

        // Find user's school
        const school = await db.school.findFirst({
            where: { ownerId: user.id }
        });

        if (!school) {
            return new NextResponse("School not found", {
                status: 404,
            });
        }

        const updatedSchool = await db.school.update({
            where: { id: school.id },
            data: {
                stripeAccountId: stripeAccountId,
                stripeAccountStatus: stripeAccountStatus || 'active',
                stripeOnboardingComplete: false,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ 
            updated: true, 
            school: updatedSchool 
        });
    } catch (error) {
        console.error("Error updating school with Stripe account:", error);
        return new NextResponse("Internal error", {
            status: 500,
        });
    }
}