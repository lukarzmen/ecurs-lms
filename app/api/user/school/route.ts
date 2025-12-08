import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID first
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get member schools - use raw queries to handle null schools gracefully
    const memberSchoolsRaw = await db.$queryRaw<
      Array<{ id: number; name: string; ownerId: number }>
    >`
      SELECT DISTINCT s.id, s.name, s."ownerId"
      FROM school_teachers st
      JOIN schools s ON st."schoolId" = s.id
      WHERE st."teacherId" = ${user.id}
    `;

    const memberSchools = memberSchoolsRaw.map((s) => ({
      id: s.id,
      name: s.name,
      isOwner: false,
    }));

    // Pobierz szkoły, które nauczyciel posiada
    const ownedSchools = await db.school.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true },
    });

    const ownedSchoolsMapped = ownedSchools.map((s) => ({
      id: s.id,
      name: s.name,
      isOwner: true,
    }));

    return NextResponse.json(
      memberSchools.length > 0 ? memberSchools : ownedSchoolsMapped.length > 0 ? ownedSchoolsMapped : []
    );
  } catch (error) {
    console.error("Error fetching user schools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
