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
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobierz szkoły, do których nauczyciel należy
    const memberSchools = await db.schoolTeacher.findMany({
      where: { teacherId: user.id },
      include: {
        school: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    // Pobierz szkoły, które nauczyciel posiada
    const ownedSchools = await db.school.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      memberSchools: memberSchools.map((ms) => ({
        id: ms.school.id,
        name: ms.school.name,
        isOwner: false,
      })),
      ownedSchools: ownedSchools.map((s) => ({
        id: s.id,
        name: s.name,
        isOwner: true,
      })),
      allSchools: [
        ...memberSchools.map((ms) => ({
          id: ms.school.id,
          name: ms.school.name,
          isOwner: false,
        })),
        ...ownedSchools.map((s) => ({
          id: s.id,
          name: s.name,
          isOwner: true,
        })),
      ],
    });
  } catch (error) {
    console.error("Error fetching user schools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
