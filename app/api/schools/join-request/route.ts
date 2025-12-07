import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await req.json();

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Pobierz użytkownika
    const user = await db.user.findUnique({
      where: { providerId: userId },
      include: {
        ownedSchools: {
          select: { id: true },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if teacher already owns a school
    if (user.roleId === 1 && user.ownedSchools && user.ownedSchools.length > 0) {
      return NextResponse.json(
        { error: "You already own a school. Teachers can only own one school." },
        { status: 400 }
      );
    }

    // Sprawdź czy szkoła istnieje
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Sprawdź czy już wysłał prośbę
    const existingRequest = await db.teacherJoinRequest.findUnique({
      where: {
        teacherId_schoolId: {
          teacherId: user.id,
          schoolId: schoolId,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You have already requested to join this school" },
        { status: 400 }
      );
    }

    // Sprawdź czy już należy do szkoły
    const existingMembership = await db.schoolTeacher.findUnique({
      where: {
        schoolId_teacherId: {
          schoolId: schoolId,
          teacherId: user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this school" },
        { status: 400 }
      );
    }

    // Stwórz prośbę dołączenia
    const joinRequest = await db.teacherJoinRequest.create({
      data: {
        teacherId: user.id,
        schoolId: schoolId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(joinRequest);
  } catch (error) {
    console.error("Error creating join request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
