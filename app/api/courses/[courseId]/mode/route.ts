import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { mode } = await req.json();
    const params = await context.params;
    const courseIdNumber = parseInt(params.courseId, 10);

    if (isNaN(courseIdNumber) || (mode !== 0 && mode !== 1)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    await db.course.update({
      where: { id: courseIdNumber },
      data: { mode },
    });

    return new NextResponse("OK");
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}