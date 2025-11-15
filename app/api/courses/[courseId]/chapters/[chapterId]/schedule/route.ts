import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST - Schedule module publication
export async function POST(
  req: Request,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const awaitedParams = await context.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseIdInt = parseInt(awaitedParams.courseId, 10);
    const chapterIdInt = parseInt(awaitedParams.chapterId, 10);

    if (isNaN(courseIdInt) || isNaN(chapterIdInt)) {
      return new NextResponse("Invalid course or chapter ID", { status: 400 });
    }

    const { publishedAt } = await req.json();
    
    if (!publishedAt) {
      return new NextResponse("Publication date is required", { status: 400 });
    }

    const publicationDate = new Date(publishedAt);
    
    if (publicationDate <= new Date()) {
      return new NextResponse("Publication date must be in the future", { status: 400 });
    }

    // Verify course ownership
    const course = await db.course.findFirst({
      where: {
        id: courseIdInt,
        author: {
          providerId: userId,
        },
      },
    });

    if (!course) {
      return new NextResponse("Unauthorized or course not found", { status: 404 });
    }

    // Verify module belongs to course
    const moduleData = await db.module.findFirst({
      where: {
        id: chapterIdInt,
        courseId: courseIdInt,
      },
    });

    if (!moduleData) {
      return new NextResponse("Module not found", { status: 404 });
    }

    // Schedule the module for publication
    const updatedModule = await db.module.update({
      where: {
        id: chapterIdInt,
      },
      data: {
        publishedAt: publicationDate,
        state: 0, // Ensure it's in draft state
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Module scheduled for publication",
      module: updatedModule,
    });

  } catch (error) {
    console.error("[SCHEDULE_MODULE_PUBLICATION]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// DELETE - Cancel scheduled publication
export async function DELETE(
  req: Request,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const awaitedParams = await context.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseIdInt = parseInt(awaitedParams.courseId, 10);
    const chapterIdInt = parseInt(awaitedParams.chapterId, 10);

    if (isNaN(courseIdInt) || isNaN(chapterIdInt)) {
      return new NextResponse("Invalid course or chapter ID", { status: 400 });
    }

    // Verify course ownership
    const course = await db.course.findFirst({
      where: {
        id: courseIdInt,
        author: {
          providerId: userId,
        },
      },
    });

    if (!course) {
      return new NextResponse("Unauthorized or course not found", { status: 404 });
    }

    // Cancel scheduled publication
    const updatedModule = await db.module.update({
      where: {
        id: chapterIdInt,
        courseId: courseIdInt,
      },
      data: {
        publishedAt: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Scheduled publication cancelled",
      module: updatedModule,
    });

  } catch (error) {
    console.error("[CANCEL_SCHEDULED_PUBLICATION]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// GET - Check publication schedule status
export async function GET(
  req: Request,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const awaitedParams = await context.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseIdInt = parseInt(awaitedParams.courseId, 10);
    const chapterIdInt = parseInt(awaitedParams.chapterId, 10);

    if (isNaN(courseIdInt) || isNaN(chapterIdInt)) {
      return new NextResponse("Invalid course or chapter ID", { status: 400 });
    }

    // Verify course ownership
    const course = await db.course.findFirst({
      where: {
        id: courseIdInt,
        author: {
          providerId: userId,
        },
      },
    });

    if (!course) {
      return new NextResponse("Unauthorized or course not found", { status: 404 });
    }

    // Get module with publication schedule
    const moduleData = await db.module.findFirst({
      where: {
        id: chapterIdInt,
        courseId: courseIdInt,
      },
      select: {
        id: true,
        title: true,
        state: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!moduleData) {
      return new NextResponse("Module not found", { status: 404 });
    }

    return NextResponse.json({
      module: moduleData,
      isScheduled: !!moduleData.publishedAt,
      isPublished: moduleData.state === 1,
    });

  } catch (error) {
    console.error("[GET_PUBLICATION_SCHEDULE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}