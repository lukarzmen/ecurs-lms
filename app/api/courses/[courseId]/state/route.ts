import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { state } = await req.json();
    const courseIdNumber = parseInt(params.courseId, 10);

    if (isNaN(courseIdNumber) || (state !== 0 && state !== 1)) {
      return new NextResponse("Invalid data", { status: 400 });
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