import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz użytkownika
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

    // Pobierz członków szkoły
    const members = await db.schoolTeacher.findMany({
      where: { schoolId: school.id },
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
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.teacher.id,
        displayName: m.teacher.displayName,
        email: m.teacher.email,
        createdAt: m.teacher.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
