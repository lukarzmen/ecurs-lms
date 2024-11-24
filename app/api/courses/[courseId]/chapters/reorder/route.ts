import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  params: {
    courseId: string;
  },
) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }
  const ownCourse = await db.course.findFirst({
    where: {
      id: params.courseId,
      userId: userId,
    },
  });
  const { list } = await req.json();
  if (!ownCourse) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  for (let item of list) {
    await db.chapter.update({
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
