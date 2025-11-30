import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
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
          select: {
            id: true,
            name: true,
            description: true,
            companyName: true,
            ownerId: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    // Pobierz szkoły, które nauczyciel posiada
    const ownedSchools = await db.school.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        companyName: true,
        ownerId: true,
      },
      orderBy: { id: "desc" },
    });

    // Mapuj szkoły z dodatkową informacją czy jest właścicielem
    const memberSchoolsWithRole = memberSchools.map((ms) => ({
      id: ms.school.id,
      name: ms.school.name,
      description: ms.school.description,
      companyName: ms.school.companyName,
      ownerId: ms.school.ownerId,
      role: "member" as const,
      addedAt: ms.addedAt,
    }));

    const ownedSchoolsWithRole = ownedSchools.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      companyName: s.companyName,
      ownerId: s.ownerId,
      role: "owner" as const,
    }));

    return NextResponse.json({
      memberSchools: memberSchoolsWithRole,
      ownedSchools: ownedSchoolsWithRole,
      allSchools: [...memberSchoolsWithRole, ...ownedSchoolsWithRole],
    });
  } catch (error) {
    console.error("Error fetching user schools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
