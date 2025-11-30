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
    const requests = await db.teacherJoinRequest.findMany({
      where: {
        schoolId: { in: schoolIds },
        status: "pending",
      },
      include: {
        teacher: {
          select: {
            id: true,
            displayName: true,
            email: true,
            companyName: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
