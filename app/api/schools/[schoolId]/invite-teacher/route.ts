import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherEmail } = await req.json();

    if (!teacherEmail) {
      return NextResponse.json(
        { error: "Teacher email is required" },
        { status: 400 }
      );
    }

    const { schoolId: schoolIdStr } = await params;
    const schoolId = parseInt(schoolIdStr);

    // Pobierz użytkownika (właściciela)
    const user = await db.user.findUnique({
      where: { providerId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobierz szkołę i sprawdź czy user jest właścicielem
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (school.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only school owner can invite teachers" },
        { status: 403 }
      );
    }

    // Szukaj nauczyciela po emailu
    const teacher = await db.user.findUnique({
      where: { email: teacherEmail },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Sprawdź czy nauczyciel już należy do szkoły
    const existingMembership = await db.schoolTeacher.findUnique({
      where: {
        schoolId_teacherId: {
          schoolId: schoolId,
          teacherId: teacher.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Teacher is already a member of this school" },
        { status: 400 }
      );
    }

    // Dodaj nauczyciela do szkoły od razu (bez zaproszenia)
    const schoolTeacher = await db.schoolTeacher.create({
      data: {
        schoolId: schoolId,
        teacherId: teacher.id,
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
      },
    });

    return NextResponse.json({
      message: "Teacher invited successfully",
      teacher: schoolTeacher.teacher,
    });
  } catch (error) {
    console.error("Error inviting teacher:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
