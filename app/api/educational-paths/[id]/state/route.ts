import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { state } = await req.json();
    const { id } = await params;
    const pathIdNumber = parseInt(id, 10);

    if (state === 1) {
      // Check if at least one course for this educational path has state 1
      const courseCount = await db.educationalPathCourse.count({
        where: {
          educationalPathId: pathIdNumber,
          course: { state: 1 },
        },
      });
      if (courseCount === 0) {
        return new NextResponse("Aby opublikować ścieżkę, najpierw opublikuj co najmniej jeden kurs.", { status: 400 });
      }
    }

    await db.educationalPath.update({
      where: { id: pathIdNumber },
      data: { state },
    });

    return new NextResponse("OK");
  } catch (error) {
    console.error("[EDUCATIONAL_PATH_STATE_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
