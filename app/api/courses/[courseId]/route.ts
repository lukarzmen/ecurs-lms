import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  const { courseId } = params;
  const values = await req.json();

  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const course = await db.course.update({
      where: {
        id: parseInt(courseId, 10),
        userId,
      },
      data: {
        ...values,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  const { courseId } = params;
  const { imageId } = await req.json();
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    const course = await db.course.update({
      where: {
      id: parseInt(courseId, 10),
      userId,
      },
      data: {
      imageId: imageId,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", {
      status: 500,
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const { userId } = auth() ?? "";
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const ownCourse = await db.course.findFirst({
      where: {
        id: parseInt(params.courseId, 10),
        userId,
      },
    });
    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const deletedCourse = await db.course.delete({
      where: {
        id: parseInt(params.courseId, 10),
        userId: userId,
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
    { params }: { params: { courseId: string } },
  ) {
    try {
      const courseIdNumber = parseInt(params.courseId, 10);

      if (isNaN(courseIdNumber)) {
        return new NextResponse("Invalid courseId", { status: 400 });
      }

      const course = await db.course.findUnique({
        where: {
          id: courseIdNumber,
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
      const lastNotFinishedModuleId = course.modules.reduce((max, module) => Math.max(max, module.id), 0);

      return NextResponse.json({
        ...course,
        lastNotFinishedModuleId: lastNotFinishedModuleId,
      });
    } catch (error) {
      console.error(error);
      return new NextResponse("Internal server error", { status: 500 });
    }
  }

