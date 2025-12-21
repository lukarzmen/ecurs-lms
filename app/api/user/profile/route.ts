import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
      include: {
        ownedSchools: {
          select: {
            id: true,
            companyName: true,
            taxId: true,
            stripeOnboardingComplete: true,
            requiresVatInvoices: true,
          },
          take: 1,
        },
        schoolMemberships: {
          select: {
            schoolId: true,
            school: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data with school business info if teacher
    const schoolData = user.ownedSchools && user.ownedSchools.length > 0 ? user.ownedSchools[0] : null;
    const isMemberOfSchool = user.schoolMemberships && user.schoolMemberships.length > 0;
    const memberSchool = isMemberOfSchool ? user.schoolMemberships[0].school : null;
    
    // Determine businessType based on role and school membership
    let businessType = 'individual';
    if (user.roleId === 1) { // teacher
      if (schoolData) {
        businessType = 'company'; // Teacher who owns a school
      } else if (isMemberOfSchool) {
        businessType = 'individual'; // Member of school (not owner)
      }
    }
    
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      email: user.email,
      businessType,
      companyName: schoolData?.companyName || null,
      taxId: schoolData?.taxId || null,
      stripeOnboardingComplete: schoolData?.stripeOnboardingComplete || false,
      requiresVatInvoices: schoolData?.requiresVatInvoices || false,
      isMemberOfSchool,
      memberSchool: memberSchool ? { id: memberSchool.id, name: memberSchool.name } : null,
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      displayName,
      businessType,
      companyName,
      taxId,
      requiresVatInvoices,
    } = body;

    // Find the user in our database
    const user = await db.user.findUnique({
      where: { providerId: userId },
      include: {
        ownedSchools: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user profile (only user fields)
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        displayName,
      },
      include: {
        ownedSchools: {
          select: {
            id: true,
            companyName: true,
            taxId: true,
            stripeOnboardingComplete: true,
            requiresVatInvoices: true,
          },
          take: 1,
        },
      },
    });

    // Update school if teacher has business data changes
    if (user.roleId === 1 && user.ownedSchools && user.ownedSchools.length > 0) {
      const schoolId = user.ownedSchools[0].id;
      await db.school.update({
        where: { id: schoolId },
        data: {
          companyName,
          taxId,
          requiresVatInvoices: requiresVatInvoices !== undefined ? requiresVatInvoices : undefined,
        },
      });
    }

    // Return combined response
    const schoolData = updatedUser.ownedSchools && updatedUser.ownedSchools.length > 0 ? updatedUser.ownedSchools[0] : null;
    
    // Determine businessType based on role and school ownership
    const calculatedBusinessType = updatedUser.roleId === 1 && schoolData ? 'company' : 'individual';
    
    return NextResponse.json({
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      businessType: calculatedBusinessType,
      companyName: schoolData?.companyName || null,
      taxId: schoolData?.taxId || null,
      stripeOnboardingComplete: schoolData?.stripeOnboardingComplete || false,
      requiresVatInvoices: schoolData?.requiresVatInvoices || false,
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}