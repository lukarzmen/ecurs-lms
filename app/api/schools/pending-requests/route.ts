import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz użytkownika
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobierz szkoły, których user jest właścicielem
    const ownedSchools = await db.school.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (ownedSchools.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const schoolIds = ownedSchools.map((s) => s.id);

    // Pobierz pending requests dla tych szkół
    // Uwaga: relationMode="prisma" nie wymusza FK w bazie, więc mogą istnieć osierocone rekordy.
    // Jeśli spróbujemy zrobić include.teacher dla relacji wymaganej, Prisma rzuci błędem, gdy teacher nie istnieje.
    const requests = await db.teacherJoinRequest.findMany({
      where: {
        schoolId: { in: schoolIds },
        status: "pending",
      },
      select: {
        id: true,
        teacherId: true,
        schoolId: true,
        status: true,
        requestedAt: true,
        respondedAt: true,
        rejectionReason: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    const teacherIds = Array.from(new Set(requests.map((r) => r.teacherId)));
    const schoolsInRequests = Array.from(new Set(requests.map((r) => r.schoolId)));

    const [teachers, schools] = await Promise.all([
      db.user.findMany({
        where: { id: { in: teacherIds } },
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      }),
      db.school.findMany({
        where: { id: { in: schoolsInRequests } },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    const teacherById = new Map(teachers.map((t) => [t.id, t] as const));
    const schoolById = new Map(schools.map((s) => [s.id, s] as const));

    const hydrated = requests
      .map((r) => {
        const teacher = teacherById.get(r.teacherId);
        const school = schoolById.get(r.schoolId);
        if (!teacher || !school) return null;
        return {
          ...r,
          teacher,
          school,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json({ requests: hydrated });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
