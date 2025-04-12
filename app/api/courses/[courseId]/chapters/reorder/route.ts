import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
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
