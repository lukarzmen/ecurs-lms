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

    const { schoolId: schoolIdStr } = await params;
    const schoolId = parseInt(schoolIdStr);

    // Pobierz użytkownika
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobierz szkołę
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Sprawdź czy user jest właścicielem szkoły
    if (school.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only school owner can view members" },
        { status: 403 }
      );
    }

    // Pobierz nauczycieli szkoły
    const schoolTeachers = await db.schoolTeacher.findMany({
      where: { schoolId: schoolId },
      include: {
        teacher: {
          select: {
            id: true,
            displayName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        addedAt: "asc",
      },
    });

    const members = schoolTeachers.map((st) => ({
      ...st.teacher,
      addedAt: st.addedAt,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching school members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
