import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const params = await context.params;
  const ownCourse = await db.course.findFirst({
    where: {
      id: Number(params.courseId)
    },
  });
  const { list } = await req.json();
  if (!ownCourse) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  for (let item of list) {
    await db.module.update({
      where: {
        id: item.id,
      },
      data: {
        position: item.position,
      },
    });
  }

  return new NextResponse("Chapters order updated", {
    status: 200,
  });
}
