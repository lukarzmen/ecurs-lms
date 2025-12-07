import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    const schoolIdNum = parseInt(schoolId, 10);

    if (isNaN(schoolIdNum)) {
      return NextResponse.json({ error: "Invalid schoolId" }, { status: 400 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to this school (owner or teacher member)
    const schoolAccess = await db.school.findFirst({
      where: {
        id: schoolIdNum,
        OR: [
          { ownerId: user.id },
          { teachers: { some: { teacherId: user.id } } },
        ],
      },
      select: { id: true },
    });

    if (!schoolAccess) {
      return NextResponse.json(
        { error: "Access denied to this school" },
        { status: 403 }
      );
    }

    // Get all distinct students enrolled in school's courses
    const students = await db.$queryRaw<
      Array<{
        id: number;
        email: string;
        firstName: string | null;
        lastName: string | null;
        createdAt: Date;
      }>
    >`
      SELECT DISTINCT u.id, u.email, u."firstName", u."lastName", u."createdAt"
      FROM "User" u
      JOIN "UserCourse" uc ON u.id = uc."userId"
      JOIN "Course" c ON uc."courseId" = c.id
      WHERE c."schoolId" = ${schoolIdNum}
      ORDER BY u."createdAt" DESC
    `;

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching school students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
