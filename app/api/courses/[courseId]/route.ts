import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const paramsResolved = await params;
  const { courseId } = paramsResolved;
  const values = await req.json();

  try {
    const course = await db.course.update({
      where: {
        id: parseInt(courseId, 10)
      },
      data: {
        ...values,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const paramsResolved = await params;
  const { courseId } = paramsResolved;
  const { imageId } = await req.json();
  try {
    const course = await db.course.update({
      where: {
        id: parseInt(courseId, 10),
      },
      data: {
        imageId: imageId,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const paramsResolved = await params;
    const { courseId } = paramsResolved;
    const deletedCourse = await db.course.delete({
      where: {
        id: parseInt(courseId, 10)
      },
      include: {
        modules: true,
      },
    });
    if (!deletedCourse) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.json(deletedCourse);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  try {
  const url = new URL(req.url);
  const showDraftsParam = url.searchParams.get("showDrafts") || url.searchParams.get("showdrafts");
  const showDrafts = showDraftsParam === "true" || showDraftsParam === "1";
  const courseIdNumber = parseInt(courseId, 10);

    if (isNaN(courseIdNumber)) {
      return new NextResponse("Invalid courseId", { status: 400 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseIdNumber,
      },
      include: {
        modules: {
          ...(showDrafts ? {} : { where: { state: 1 } }),
          orderBy: {
            position: "asc",
          },
        },
        price: true,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

