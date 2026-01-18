import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { state } = await req.json();
    const {courseId} = await params;
    const courseIdNumber = parseInt(courseId, 10);

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

    revalidateTag("learning-units-search");

    return new NextResponse("OK");
  } catch (error) {
    console.error("[COURSE_STATE_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}