import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; teacherId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId: schoolIdStr, teacherId: teacherIdStr } = await params;
    const schoolId = parseInt(schoolIdStr);
    const teacherId = parseInt(teacherIdStr);

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
        { error: "Only school owner can remove teachers" },
        { status: 403 }
      );
    }

    // Usuń nauczyciela ze szkoły
    await db.schoolTeacher.delete({
      where: {
        schoolId_teacherId: {
          schoolId: schoolId,
          teacherId: teacherId,
        },
      },
    });

    return NextResponse.json({
      message: "Teacher removed from school",
    });
  } catch (error) {
    console.error("Error removing teacher:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
