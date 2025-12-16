import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user in database
    const user = await db.user.findFirst({
      where: { providerId: userId },
      include: {
        ownedSchools: {
          select: { id: true }
        },
        schoolMemberships: {
          select: { schoolId: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is a school owner
    const isSchoolOwner = user.ownedSchools.length > 0;

    // Check if user is a school member (but not owner)
    const isSchoolMember = user.schoolMemberships.length > 0;

    return NextResponse.json({
      isSchoolOwner,
      isSchoolMember: isSchoolMember && !isSchoolOwner
    });
  } catch (error) {
    console.error("[GET /api/teacher/school-status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
