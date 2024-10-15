import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } },
) {
  const { courseId } = params;
  const values = await req.json();
  console.log(values);
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const ownCourse = await db.course.findFirst({
      where: {
        id: courseId,
        userId,
      },
    });
    if (!ownCourse) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const publishedChapters = await db.chapter.update({
      where: {
        id: params.chapterId,
      },
      data: {
        isPublished: true,
      },
    });
    return NextResponse.json(publishedChapters);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}
