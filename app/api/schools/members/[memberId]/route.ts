import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const memberId = parseInt(resolvedParams.memberId);

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Pobierz użytkownika (właściciela szkoły)
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobierz członka szkoły
    const member = await db.schoolTeacher.findUnique({
      where: { id: memberId },
      include: {
        school: {
          select: { ownerId: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Sprawdź czy user jest właścicielem szkoły
    if (member.school.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Only school owner can remove members" },
        { status: 403 }
      );
    }

    // Usuń członka szkoły
    await db.schoolTeacher.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
