import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    const schoolIdNum = parseInt(schoolId, 10);

    // Get current user
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is member of the school
    const schoolMember = await db.schoolTeacher.findUnique({
      where: {
        schoolId_teacherId: {
          schoolId: schoolIdNum,
          teacherId: user.id,
        },
      },
    });

    if (!schoolMember) {
      return NextResponse.json(
        { error: "You are not a member of this school" },
        { status: 404 }
      );
    }

    // Check if user is owner - can't leave as owner
    const school = await db.school.findUnique({
      where: { id: schoolIdNum },
      select: { ownerId: true },
    });

    if (school?.ownerId === user.id) {
      return NextResponse.json(
        { error: "School owner cannot leave the school. Delete the school instead." },
        { status: 403 }
      );
    }

    // Remove user from school
    await db.schoolTeacher.delete({
      where: {
        schoolId_teacherId: {
          schoolId: schoolIdNum,
          teacherId: user.id,
        },
      },
    });

    return NextResponse.json({ message: "Successfully left the school" });
  } catch (error) {
    console.error("Error leaving school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
