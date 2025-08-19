import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { state } = await req.json();
    const courseIdNumber = parseInt(params.courseId, 10);
    // course can change state to 1 only if at least one module has state 1
    if (isNaN(courseIdNumber) || (state !== 0 && state !== 1)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    if (state === 1) {
      // Check if at least one module for this course has state 1
      const moduleCount = await db.module.count({
        where: {
          courseId: courseIdNumber,
          state: 1,
        },
      });
      if (moduleCount === 0) {
        return new NextResponse("Aby opublikować kurs, najpierw opublikuj co najmniej jeden moduł.", { status: 400 });
      }
    }

    await db.course.update({
      where: { id: courseIdNumber },
      data: { state },
    });

    return new NextResponse("OK");
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}