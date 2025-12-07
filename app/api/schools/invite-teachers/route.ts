import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid userIds" },
        { status: 400 }
      );
    }

    // Pobierz użytkownika (właściciela szkoły)
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobierz szkołę, którą nauczyciel posiada
    const school = await db.school.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Pobierz nauczycieli do zaproszenia
    const teachers = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });

    if (teachers.length === 0) {
      return NextResponse.json(
        { error: "Teachers not found" },
        { status: 404 }
      );
    }

    // Check for existing requests or memberships
    const existingRequests = await db.teacherJoinRequest.findMany({
      where: {
        schoolId: school.id,
        teacherId: { in: teachers.map(t => t.id) },
      },
      select: { teacherId: true },
    });

    const existingMemberships = await db.schoolTeacher.findMany({
      where: {
        schoolId: school.id,
        teacherId: { in: teachers.map(t => t.id) },
      },
      select: { teacherId: true },
    });

    const existingTeacherIds = new Set([
      ...existingRequests.map(r => r.teacherId),
      ...existingMemberships.map(m => m.teacherId),
    ]);

    // Filter out teachers who already have requests or memberships
    const teachersToInvite = teachers.filter(t => !existingTeacherIds.has(t.id));

    if (teachersToInvite.length === 0) {
      return NextResponse.json(
        { error: "All selected teachers already have requests or are members" },
        { status: 400 }
      );
    }

    // Utwórz prośby o dołączenie dla każdego nauczyciela
    const createdRequests = await Promise.all(
      teachersToInvite.map((teacher) =>
        db.teacherJoinRequest.create({
          data: {
            schoolId: school.id,
            teacherId: teacher.id,
            status: "pending",
          },
          include: {
            teacher: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        })
      )
    );

    return NextResponse.json({ requests: createdRequests }, { status: 201 });
  } catch (error) {
    console.error("Error inviting teachers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
