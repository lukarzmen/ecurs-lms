import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { businessData } = await req.json();
    
    if (!businessData) {
      return NextResponse.json(
        { error: "No business data provided" },
        { status: 400 }
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
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        roleId: true,
        displayName: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only teachers can update business data
    if (user.roleId !== 1) {
      return NextResponse.json(
        { error: "Only teachers can update business data" },
        { status: 403 }
      );
    }

    // Find teacher's school
    const school = await db.school.findFirst({
      where: { ownerId: user.id },
      select: { id: true }
    });

    if (!school) {
      return NextResponse.json(
        { error: "Teacher has no school" },
        { status: 400 }
      );
    }

    // Update school with new business data
    const updateData: any = {};

    if (businessData.schoolName) {
      updateData.name = businessData.schoolName;
    }

    if (businessData.businessType === "company") {
      if (businessData.companyName) {
        updateData.companyName = businessData.companyName;
      }
      if (businessData.taxId) {
        updateData.taxId = businessData.taxId;
      }
      if (businessData.requiresVatInvoices !== undefined) {
        updateData.requiresVatInvoices = businessData.requiresVatInvoices;
      }
      updateData.schoolType = "business";
    } else {
      updateData.schoolType = "individual";
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No updates to apply", school },
        { status: 200 }
      );
    }

    updateData.updatedAt = new Date();

    const updatedSchool = await db.school.update({
      where: { id: school.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        companyName: true,
        taxId: true,
        requiresVatInvoices: true,
      }
    });

    console.log('[POST /api/user/update-business-data] School updated:', updatedSchool.id);

    return NextResponse.json(
      { 
        message: "Business data updated successfully",
        school: updatedSchool
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/user/update-business-data] Error:', error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
