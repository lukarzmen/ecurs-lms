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

    // Sprawdź czy user jest właścicielem szkoły
    const school = await db.school.findUnique({
      where: { id: schoolIdNum },
      select: { ownerId: true },
    });

    if (!school || school.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pobierz parametr wyszukiwania
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.toLowerCase() || "";

    // Pobierz wszystkich nauczycieli z bazy
    const teachers = await db.user.findMany({
      where: {
        AND: [
          {
            // Wyszukaj po emailu lub displayName
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { displayName: { contains: search, mode: "insensitive" } },
            ],
          },
          // Nie uwzględniaj użytkownika, który zarządza szkołą
          { id: { not: user.id } },
        ],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
      take: 20, // Ogranicz wyniki do 20
    });

    // Przefiltruj nauczycieli, którzy już są w szkole
    const existingTeachers = await db.schoolTeacher.findMany({
      where: { schoolId: schoolIdNum },
      select: { teacherId: true },
    });

    const existingTeacherIds = new Set(
      existingTeachers.map((st) => st.teacherId)
    );

    const availableTeachers = teachers.filter(
      (t) => !existingTeacherIds.has(t.id)
    );

    return NextResponse.json(availableTeachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
