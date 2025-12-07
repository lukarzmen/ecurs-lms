import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, companyName, taxId } = await req.json();

    if (!name || !companyName || !taxId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Pobierz użytkownika
    const user = await db.user.findUnique({
      where: { providerId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resolvedParams = await params;
    const schoolId = parseInt(resolvedParams.schoolId);

    // Sprawdź, czy szkoła należy do użytkownika
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { ownerId: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    if (school.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You do not own this school" },
        { status: 403 }
      );
    }

    // Zaktualizuj szkołę
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        name,
        description,
        companyName,
        taxId,
      },
    });

    return NextResponse.json({ school: updatedSchool });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
