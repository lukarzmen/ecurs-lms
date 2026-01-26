import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clerkClient, currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "No email found in Clerk user" },
        { status: 400 }
      );
    }

    // Find user by email
    const existingUser = await db.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        providerId: true,
        roleId: true,
        displayName: true,
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
        teacherPlatformSubscription: {
          select: {
            subscriptionStatus: true,
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found", shouldCreateNew: true },
        { status: 404 }
      );
    }

    // Get membership school separately to avoid Prisma errors
    let membershipSchool = null;
    if (!existingUser.ownedSchools?.[0]) {
      const membership = await db.schoolTeacher.findFirst({
        where: { teacherId: existingUser.id },
        select: {
          schoolId: true,
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
        membershipSchool = membership.school;
      }
    }

    // Check if user has all required fields
    const hasAllFields = !!(
      existingUser.email &&
      existingUser.firstName &&
      existingUser.lastName &&
      existingUser.roleId !== null
    );

    // Always update providerId if it's missing or different
    if (!existingUser.providerId || existingUser.providerId !== clerkUser.id) {
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          providerId: clerkUser.id,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          providerId: true,
          roleId: true,
          displayName: true,
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
          teacherPlatformSubscription: {
            select: {
              subscriptionStatus: true,
            }
          }
        }
      });

      // Get membership school after update
      let updatedMembershipSchool = membershipSchool;
      if (!updatedUser.ownedSchools?.[0]) {
        const membership = await db.schoolTeacher.findFirst({
          where: { teacherId: updatedUser.id },
          select: {
            schoolId: true,
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
          updatedMembershipSchool = membership.school;
        }
      }

      console.log('[POST /api/user/update-provider-id] ProviderId updated for user:', updatedUser.id);

      // Determine next step based on role
      const isTeacher = updatedUser.roleId === 1;
      const schoolId = updatedUser.ownedSchools?.[0]?.id ?? updatedMembershipSchool?.id ?? null;
      const stripeOnboardingComplete = updatedUser.ownedSchools?.[0]?.stripeOnboardingComplete ?? updatedMembershipSchool?.stripeOnboardingComplete ?? false;
      const ownsSchool = !!updatedUser.ownedSchools?.[0];
      const membershipSchoolId = updatedMembershipSchool?.id;
      const isMemberOfOtherSchool = !!(membershipSchoolId && (!ownsSchool || membershipSchoolId !== updatedUser.ownedSchools?.[0]?.id));
      // Teacher has active subscription if:
      // 1. They have an active personal platform subscription, OR
      // 2. They belong to a different school (owner covers subscription)
      const hasActiveSubscription = isMemberOfOtherSchool || updatedUser.teacherPlatformSubscription?.subscriptionStatus === 'active';

      // If profile is incomplete, return 206 (Partial Content) with incomplete flag
      if (!hasAllFields) {
        return NextResponse.json({
          updated: true,
          profileComplete: false,
          user: updatedUser,
          isTeacher,
          schoolId,
          stripeOnboardingComplete,
          hasActiveSubscription,
          ownedSchools: updatedUser.ownedSchools,
          membershipSchool: updatedMembershipSchool,
          message: "ProviderId updated but profile is incomplete - continue registration"
        }, { status: 206 });
      }

      // If profile is complete, return 200 (OK) - registration can finish
      return NextResponse.json({
        updated: true,
        profileComplete: true,
        user: updatedUser,
        isTeacher,
        schoolId,
        stripeOnboardingComplete,
        hasActiveSubscription,
        ownedSchools: updatedUser.ownedSchools,
        membershipSchool: updatedMembershipSchool,
        message: "ProviderId updated successfully and registration can complete"
      });
    } else {
      // ProviderId already exists and is correct
      if (!hasAllFields) {
        const isTeacher = existingUser.roleId === 1;
        const schoolId = existingUser.ownedSchools?.[0]?.id ?? membershipSchool?.id ?? null;
        const stripeOnboardingComplete = existingUser.ownedSchools?.[0]?.stripeOnboardingComplete ?? membershipSchool?.stripeOnboardingComplete ?? false;
        const ownsSchool = !!existingUser.ownedSchools?.[0];
        const membershipSchoolId = membershipSchool?.id;
        const isMemberOfOtherSchool = !!(membershipSchoolId && (!ownsSchool || membershipSchoolId !== existingUser.ownedSchools?.[0]?.id));
        // Teacher has active subscription if they pay themselves or belong to a different school
        const hasActiveSubscription = isMemberOfOtherSchool || existingUser.teacherPlatformSubscription?.subscriptionStatus === 'active';
        
        return NextResponse.json(
          { 
            error: "User exists but missing required fields",
            profileComplete: false,
            user: existingUser,
            isTeacher,
            schoolId,
            stripeOnboardingComplete,
            hasActiveSubscription,
            ownedSchools: existingUser.ownedSchools,
            membershipSchool: membershipSchool,
          },
          { status: 206 }
        );
      }

      // Already has correct providerId and complete profile
      const isTeacher = existingUser.roleId === 1;
      const schoolId = existingUser.ownedSchools?.[0]?.id ?? membershipSchool?.id ?? null;
      const stripeOnboardingComplete = existingUser.ownedSchools?.[0]?.stripeOnboardingComplete ?? membershipSchool?.stripeOnboardingComplete ?? false;
      const ownsSchool = !!existingUser.ownedSchools?.[0];
      const membershipSchoolId = membershipSchool?.id;
      const isMemberOfOtherSchool = !!(membershipSchoolId && (!ownsSchool || membershipSchoolId !== existingUser.ownedSchools?.[0]?.id));
      // Teacher has active subscription if they pay themselves or belong to a different school
      const hasActiveSubscription = isMemberOfOtherSchool || existingUser.teacherPlatformSubscription?.subscriptionStatus === 'active';
      
      return NextResponse.json({
        updated: false,
        alreadyUpToDate: true,
        profileComplete: true,
        user: existingUser,
        isTeacher,
        schoolId,
        stripeOnboardingComplete,
        hasActiveSubscription,
        ownedSchools: existingUser.ownedSchools,
        membershipSchool: membershipSchool,
        message: "ProviderId already correct and profile is complete"
      });
    }
  } catch (error) {
    console.error('[POST /api/user/update-provider-id] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
