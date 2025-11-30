import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
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

    // Pobierz użytkownika
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Sprawdź czy user jest właścicielem szkoły lub należy do niej
    const school = await db.school.findUnique({
      where: { id: schoolIdNum },
      select: { ownerId: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const isOwner = school.ownerId === user.id;

    // Jeśli nie jest właścicielem, sprawdź czy należy do szkoły
    if (!isOwner) {
      const isMember = await db.schoolTeacher.findUnique({
        where: {
          schoolId_teacherId: {
            schoolId: schoolIdNum,
            teacherId: user.id,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Pobierz statistyki szkoły
    const teacherCount = await db.schoolTeacher.count({
      where: { schoolId: schoolIdNum },
    });

    const joinRequests = await db.teacherJoinRequest.count({
      where: {
        schoolId: schoolIdNum,
        status: "pending",
      },
    });

    const school_details = await db.school.findUnique({
      where: { id: schoolIdNum },
      select: {
        id: true,
        name: true,
        description: true,
        companyName: true,
        createdAt: true,
        ownerId: true,
      },
    });

    return NextResponse.json({
      school: school_details,
      teacherCount,
      pendingJoinRequests: joinRequests,
      isOwner,
    });
  } catch (error) {
    console.error("Error fetching school stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
