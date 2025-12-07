import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // First check if user is school owner
    let school = await db.school.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, description: true },
    });

    // If not owner, check if user is a teacher member
    if (!school) {
      const schoolMember = await db.schoolTeacher.findFirst({
        where: { teacherId: user.id },
        select: { schoolId: true },
      });

      if (schoolMember) {
        school = await db.school.findUnique({
          where: { id: schoolMember.schoolId },
          select: { id: true, name: true, description: true },
        });
      }
    }

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    console.log("User school found:", school.id);
    return NextResponse.json(school);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
