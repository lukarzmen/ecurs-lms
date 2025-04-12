import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  const { courseId } = params;
  const courseIdInt = parseInt(courseId, 10);
  if (isNaN(courseIdInt)) {
    return new NextResponse("Invalid courseId", {
      status: 400,
    });
  }
  try {
    const { title } = await req.json();
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseIdInt
      },
    });
    if (!courseOwner) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    const lastChapters = await db.module.findFirst({
      where: {
        courseId: courseIdInt
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastChapters ? lastChapters.position + 1 : 1;

    const chapter = await db.module.create({
      data: {
        courseId: courseIdInt,
        position: newPosition,
        title: title,
      },
    });
    return NextResponse.json(chapter);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const courseId = parseInt(params.courseId, 10);

    if (isNaN(courseId)) {
      return new NextResponse("Invalid courseId", { status: 400 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        modules: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("[COURSE_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}