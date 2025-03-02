import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } },
) {
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseIdInt = parseInt(params.courseId, 10);
    const ownCourse = await db.course.findFirst({
      where: {
        id: courseIdInt,
        userId,
      },
    });
    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const deletedChapter = await db.module.delete({
      where: {
        id: params.chapterId,
      },
    });

    const publishedChaptersInCourse = await db.module.findMany({
      where: {
        courseId: courseIdInt,
      },
    });

    return NextResponse.json(deletedChapter);
  } catch (error) {
    console.log("[COURSES_CHAPTER_ID]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } },
) {
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseIdInt = parseInt(params.courseId, 10);
    const chapterIdInt = parseInt(params.chapterId, 10);
    const ownCourse = await db.course.findFirst({
      where: {
        id: courseIdInt,
        userId,
      },
    });
    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { isPublished, ...values } = await req.json();
    const chapter = await db.module.update({
      where: {
        id: chapterIdInt,
      },
      data: {
        ...values,
      },
    });
    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[COURSES_CHAPTER_ID]", error);
    return new Response("Internal server error", { status: 500 });
  }
}
