import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } | Promise<{ courseId: string }> },
) {
  try {
    const awaitedParams = await params;
    const courseIdNumber = parseInt(awaitedParams.courseId, 10);

    if (isNaN(courseIdNumber)) {
      return new NextResponse("Invalid courseId", { status: 400 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new NextResponse("Missing userId query parameter", { status: 400 });
    }

    const user = await db.user.findUnique({
      where: {
        providerId: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseIdNumber,
      },
      include: {
        modules: {
          where: {
            state: 1,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const userModules = await db.userModule.findMany({
      where: {
        userId: user.id,
        moduleId: {
          in: course.modules.map((module) => module.id),
        },
      },
    });

    const firstNotFinishedModuleId = course.modules.find(
      (module) => !userModules.some((userModule) => userModule.moduleId === module.id && userModule.isFinished)
    )?.id;

    return NextResponse.json({
      ...course,
      firstNotFinishedModuleId: firstNotFinishedModuleId || null,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
